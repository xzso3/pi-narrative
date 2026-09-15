import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  acknowledgeConsequences,
  buildEngineExport,
  buildLocalizationCatalog,
  buildSaveGameSnapshot,
  consequenceDeliveryId,
  createCheckpoint,
  inspectProjectSchema,
  migrateProjectSchema,
  stateToEngineDto,
  validateCheckpoint,
  validateProjectForEngine,
  writeEngineExport,
  writeSaveGameSnapshot,
} from "../src/engine-integration.js";

function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function fixture({ legacyProject = false, malformedConsequence = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pi-narrative-v05-"));
  const n = (...parts) => path.join(root, "narrative", ...parts);
  write(n("project.json"), legacyProject
    ? { id: "roadside", name: "Roadside", schemaVersion: "0.4" }
    : { id: "roadside", name: "Roadside", protocol: "pi-narrative.project/v1", schemaVersion: 1 });
  write(n("world.json"), { facts: [{ id: "bridge-open", actorVisible: true }] });
  write(n("characters", "mara.json"), { id: "mara", name: "Mara" });
  write(n("characters", "oren.json"), { id: "oren", name: "Oren" });
  write(n("scenes", "fuel-bargain.json"), {
    id: "fuel-bargain", title: "Fuel Bargain", cast: ["mara", "oren"], location: "Station", situation: "Trade", outcome: { stateChanges: [] },
  });
  write(n("choices", "departure.json"), {
    id: "departure", sceneId: "fuel-bargain", prompt: "What do you do?", options: [
      { id: "trade", label: "Trade medicine", outcomeText: "The trade is made." },
      { id: "stay", label: "Stay", outcomeText: "Mara stays." },
    ],
  });
  write(n("quests", "survive.json"), {
    id: "survive", title: "Survive Mile 83", objectives: [{ id: "leave", title: "Leave the station", completeWhen: { op: "const", value: false } }],
  });
  write(n("state", "initial.json"), {
    protocol: "pi-narrative.state/v0.3", revision: 0,
    characters: {
      mara: { attributes: { wounded: false }, resources: { fuelLiters: 2 }, relationships: { oren: { trust: 0.1 } }, knowledge: { factIds: [] } },
      oren: { resources: { fuelLiters: 30 }, relationships: { mara: { trust: 0 } }, knowledge: { factIds: [] } },
    },
    world: { flags: { stormIncoming: true } },
  });
  write(n("events", "000001-trade.json"), {
    protocol: "pi-narrative.event/v0.4", id: "trade", source: { type: "choice", choiceId: "departure", optionId: "trade" },
    revisionBefore: 0, revisionAfter: 1, outcome: "accepted", observableResult: "Trade completed.",
    deltas: [
      { type: "resource", characterId: "mara", resourceId: "fuelLiters", op: "increment", value: 10 },
      { type: "resource", characterId: "oren", resourceId: "fuelLiters", op: "increment", value: -10 },
    ],
    gameplayConsequences: malformedConsequence
      ? [{ type: "unlock" }]
      : [{ type: "unlock", id: "north-road", sceneId: "north-road", showToast: true }],
    createdAt: "2026-09-15T00:00:00.000Z",
  });
  write(n("events", "000002-storm.json"), {
    protocol: "pi-narrative.event/v0.4", id: "storm", source: { type: "system", sourceId: "weather" },
    revisionBefore: 1, revisionAfter: 2, outcome: "accepted", observableResult: "The storm reaches the station.",
    deltas: [{ type: "state", scope: "world", key: "stormArrived", op: "set", value: true }],
    createdAt: "2026-09-15T00:01:00.000Z",
  });
  return root;
}

test("engine export uses Unity-friendly arrays and deterministic delivery ids", () => {
  const root = fixture();
  const doc = buildEngineExport(root, { consumerId: "unity" });
  assert.equal(doc.schemaVersion, 1);
  assert.equal(doc.cursor.revision, 2);
  assert.equal(doc.state.characters.find((c) => c.id === "mara").resources.find((r) => r.id === "fuelLiters").value, 12);
  assert.equal(doc.state.worldFlags.find((f) => f.key === "stormArrived").booleanValue, true);
  assert.equal(doc.consequences.length, 1);
  assert.equal(doc.consequences[0].deliveryId, "pn-1-trade-0");
  assert.match(doc.deliverySemantics, /at-least-once/);
  assert.ok(Array.isArray(doc.localization));
});

test("ACK is durable and idempotent, and acknowledged effects stop exporting", () => {
  const root = fixture();
  const id = buildEngineExport(root, { consumerId: "unity" }).consequences[0].deliveryId;
  const first = acknowledgeConsequences(root, "unity", [id]);
  assert.deepEqual(first.newlyAcked, [id]);
  const second = acknowledgeConsequences(root, "unity", [id]);
  assert.deepEqual(second.alreadyAcked, [id]);
  assert.equal(buildEngineExport(root, { consumerId: "unity" }).consequences.length, 0);
});

test("ACK rejects unknown delivery ids", () => {
  const root = fixture();
  assert.throws(() => acknowledgeConsequences(root, "unity", ["pn-999-missing-0"]), /Unknown delivery id/);
});

test("unacknowledged consequences redeliver until ACK", () => {
  const root = fixture();
  const first = buildEngineExport(root, { consumerId: "unity" });
  assert.equal(first.cursor.revision, 2);
  assert.equal(first.consequences.length, 1);
  const id = first.consequences[0].deliveryId;
  // Re-exporting the same or later narrative state MUST redeliver until ACK.
  assert.equal(buildEngineExport(root, { consumerId: "unity" }).consequences[0].deliveryId, id);
  acknowledgeConsequences(root, "unity", [id]);
  assert.equal(buildEngineExport(root, { consumerId: "unity" }).consequences.length, 0);
});

test("save snapshot captures narrative cursor and ACK state with deterministic snapshot id", () => {
  const root = fixture();
  const id = buildEngineExport(root, { consumerId: "unity" }).consequences[0].deliveryId;
  acknowledgeConsequences(root, "unity", [id]);
  const a = buildSaveGameSnapshot(root, { consumerId: "unity", slotId: "slot1", metadata: { note: "a" } });
  const b = buildSaveGameSnapshot(root, { consumerId: "unity", slotId: "slot1", metadata: { note: "b" } });
  assert.equal(a.snapshotId, b.snapshotId);
  assert.deepEqual(a.acknowledgedDeliveryIds, [id]);
  assert.equal(a.cursor.revision, 2);
  const written = writeSaveGameSnapshot(root, { consumerId: "unity", slotId: "slot1" });
  assert.ok(fs.existsSync(written.file));
});

test("checkpoint validates immutable event-log prefix and detects tampering", () => {
  const root = fixture();
  const { file, checkpoint } = createCheckpoint(root, { label: "before-drive" });
  assert.ok(fs.existsSync(file));
  assert.equal(validateCheckpoint(root, checkpoint).valid, true);
  const eventFile = path.join(root, "narrative", "events", "000001-trade.json");
  const event = JSON.parse(fs.readFileSync(eventFile, "utf8"));
  event.gameplayConsequences[0].id = "tampered";
  write(eventFile, event);
  assert.equal(validateCheckpoint(root, checkpoint).valid, false);
});

test("legacy project manifest migrates explicitly from schema 0 to 1", () => {
  const root = fixture({ legacyProject: true });
  assert.equal(inspectProjectSchema(root).needsMigration, true);
  const preview = migrateProjectSchema(root);
  assert.equal(preview.toVersion, 1);
  assert.equal(preview.manifest.legacySchemaVersion, "0.4");
  assert.equal(inspectProjectSchema(root).version, 0);
  migrateProjectSchema(root, { write: true });
  assert.equal(inspectProjectSchema(root).version, 1);
});

test("engine validator warns for legacy schema but rejects malformed consequences", () => {
  const legacy = fixture({ legacyProject: true });
  const legacyResult = validateProjectForEngine(legacy);
  assert.equal(legacyResult.valid, true);
  assert.equal(legacyResult.warnings.length, 1);
  const malformed = fixture({ malformedConsequence: true });
  const malformedResult = validateProjectForEngine(malformed);
  assert.equal(malformedResult.valid, false);
  assert.match(malformedResult.errors.join(" "), /gameplayConsequences/);
});

test("localization catalog creates stable authored IDs", () => {
  const root = fixture();
  const keys = buildLocalizationCatalog(root).map((entry) => entry.key);
  assert.ok(keys.includes("scene.fuel-bargain.title"));
  assert.ok(keys.includes("choice.departure.prompt"));
  assert.ok(keys.includes("choice.departure.option.trade.label"));
  assert.ok(keys.includes("quest.survive.objective.leave.title"));
});

test("state DTO avoids dynamic dictionaries at public Unity boundary", () => {
  const dto = stateToEngineDto({ revision: 1, characters: { a: { attributes: { hp: 3 }, resources: { fuel: 2 }, relationships: { b: { trust: 0.5 } }, knowledge: { factIds: ["x"] } } }, world: { flags: { rain: true } } });
  assert.ok(Array.isArray(dto.characters));
  assert.ok(Array.isArray(dto.characters[0].attributes));
  assert.ok(Array.isArray(dto.characters[0].relationships));
  assert.ok(Array.isArray(dto.worldFlags));
});

test("writeEngineExport produces immutable revision export plus latest pointer", () => {
  const root = fixture();
  const result = writeEngineExport(root, { consumerId: "unity" });
  assert.ok(fs.existsSync(result.file));
  assert.ok(fs.existsSync(path.join(root, "narrative", "exports", "unity", "latest.json")));
});

test("consequence delivery id rejects invalid inputs", () => {
  assert.throws(() => consequenceDeliveryId({}, 0), /invalid event/);
});
