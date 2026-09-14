import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  actorMutableStateView,
  commitNarrativeEvent,
  listNarrativeEvents,
  loadNarrativeState,
  replayNarrativeState,
  validateArbiterDecision,
  validateInitialState,
  validateStateDelta,
} from "../src/state-engine.js";

const fixture = path.resolve("examples/roadside-station");
function tmpProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-narrative-v03-state-"));
  fs.cpSync(fixture, tmp, { recursive: true });
  return tmp;
}


test("initial mutable state cannot smuggle author-only knowledge into runtime", () => {
  const root = tmpProject();
  const initialPath = path.join(root, "narrative/state/initial.json");
  const initial = JSON.parse(fs.readFileSync(initialPath, "utf8"));
  initial.characters.mara.knowledge.factIds.push("mara-dies-later");
  const check = validateInitialState(root, initial);
  assert.equal(check.valid, false);
  assert.ok(check.errors.some((error) => error.includes("mara-dies-later")));
});

test("StateDelta validation prevents impossible resources and author-only knowledge", () => {
  const root = tmpProject();
  const state = loadNarrativeState(root);
  assert.equal(validateStateDelta(root, state, {
    type: "resource", characterId: "mara", resourceId: "fuelLiters", op: "increment", value: -3,
  }).valid, false);
  assert.equal(validateStateDelta(root, state, {
    type: "relationship", fromCharacterId: "mara", toCharacterId: "oren", metric: "trust", op: "set", value: 2,
  }).valid, false);
  assert.equal(validateStateDelta(root, state, {
    type: "knowledge", characterId: "mara", factId: "mara-dies-later", op: "add",
  }).valid, false);
});

test("event log is source of truth and current state is replayable", () => {
  const root = tmpProject();
  const result = commitNarrativeEvent(root, {
    id: "sim-turn-1",
    simulationId: "sim",
    turn: 1,
    characterId: "mara",
    baseRevision: 0,
    actorResponse: { intent: "buy fuel", action: "offers a trade" },
    decision: {
      outcome: "accepted",
      observableResult: "Oren transfers five liters to Mara.",
      deltas: [
        { type: "resource", characterId: "oren", resourceId: "fuelLiters", op: "increment", value: -5 },
        { type: "resource", characterId: "mara", resourceId: "fuelLiters", op: "increment", value: 5 }
      ]
    }
  });
  assert.equal(result.state.revision, 1);
  assert.equal(result.state.characters.mara.resources.fuelLiters, 7);
  assert.equal(result.state.characters.oren.resources.fuelLiters, 30);
  assert.equal(listNarrativeEvents(root).length, 1);
  assert.deepEqual(replayNarrativeState(root), loadNarrativeState(root));
  assert.equal(actorMutableStateView(root, "mara").resources.fuelLiters, 7);
});

test("rejected actions cannot mutate state and revision conflicts are rejected", () => {
  const root = tmpProject();
  const state = loadNarrativeState(root);
  const invalid = validateArbiterDecision(root, state, {
    outcome: "rejected",
    observableResult: "The locked valve does not move.",
    deltas: [{ type: "resource", characterId: "mara", resourceId: "fuelLiters", op: "increment", value: 5 }]
  });
  assert.equal(invalid.valid, false);

  commitNarrativeEvent(root, {
    id: "first", simulationId: "sim", turn: 1, characterId: "mara", baseRevision: 0,
    decision: { outcome: "accepted", observableResult: "Nothing durable changes.", deltas: [] }
  });
  assert.throws(() => commitNarrativeEvent(root, {
    id: "stale", simulationId: "sim", turn: 2, characterId: "oren", baseRevision: 0,
    decision: { outcome: "accepted", observableResult: "Nothing durable changes.", deltas: [] }
  }), /revision conflict/);
});

test("compound deltas validate sequentially and cannot bypass resource bounds", () => {
  const root = tmpProject();
  const state = loadNarrativeState(root);
  const invalid = validateArbiterDecision(root, state, {
    outcome: "accepted",
    observableResult: "Two withdrawals are attempted.",
    deltas: [
      { type: "resource", characterId: "mara", resourceId: "fuelLiters", op: "increment", value: -2 },
      { type: "resource", characterId: "mara", resourceId: "fuelLiters", op: "increment", value: -1 }
    ]
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some((error) => error.includes("cannot become negative")));
});
