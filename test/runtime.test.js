import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  appendActorTurn,
  buildActorTurnContext,
  createSimulation,
  loadSimulation,
  nextActorId,
  runNextTurn,
  simulationReplay,
  validateActorResponse,
} from "../src/runtime.js";

const fixture = path.resolve("examples/roadside-station");
function tmpProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-narrative-v02-"));
  fs.cpSync(fixture, tmp, { recursive: true });
  return tmp;
}

test("ActorResponse schema rejects missing intent/action", () => {
  assert.equal(validateActorResponse({ intent: "probe", action: "waits" }).valid, true);
  assert.equal(validateActorResponse({ action: "waits" }).valid, false);
  assert.equal(validateActorResponse({ intent: "probe" }).valid, false);
});

test("turn scheduler follows cast order and completes at maxTurns", () => {
  const root = tmpProject();
  const sim = createSimulation(root, "fuel-bargain", { id: "round-robin", maxTurns: 3 });
  assert.equal(nextActorId(sim), "mara");
  appendActorTurn(root, sim.id, "mara", { intent: "buy fuel", action: "sets coins down" });
  assert.equal(nextActorId(loadSimulation(root, sim.id)), "oren");
  appendActorTurn(root, sim.id, "oren", { intent: "deflect", action: "pushes the coins back" });
  assert.equal(nextActorId(loadSimulation(root, sim.id)), "mara");
  const result = appendActorTurn(root, sim.id, "mara", { intent: "press", action: "does not take the coins" });
  assert.equal(result.simulation.status, "completed");
  assert.equal(result.nextActorId, null);
});

test("other Actors perceive action/dialogue but not intent/rationale/emotion", () => {
  const root = tmpProject();
  const sim = createSimulation(root, "fuel-bargain", { id: "privacy", maxTurns: 4 });
  appendActorTurn(root, sim.id, "mara", {
    intent: "secretly test Oren",
    action: "looks toward the locked shed",
    dialogue: "Five liters?",
    rationale: "She thinks he is lying.",
    emotionalShift: { suspicion: 0.2 },
  });
  const context = buildActorTurnContext(root, loadSimulation(root, sim.id));
  const serialized = JSON.stringify(context.simulation.perceivedHistory);
  assert.match(serialized, /locked shed/);
  assert.match(serialized, /Five liters/);
  assert.doesNotMatch(serialized, /secretly test Oren/);
  assert.doesNotMatch(serialized, /She thinks he is lying/);
  assert.doesNotMatch(serialized, /suspicion/);
});

test("runNextTurn supports replay/resume from persisted transcript", async () => {
  const root = tmpProject();
  const sim = createSimulation(root, "fuel-bargain", { id: "resume", maxTurns: 2 });
  const seen = [];
  const actorRunner = async ({ characterId, context }) => {
    seen.push({ characterId, history: context.simulation.perceivedHistory.length });
    return { intent: `goal-${characterId}`, action: `${characterId} acts`, dialogue: `${characterId} speaks` };
  };
  await runNextTurn(root, sim.id, actorRunner);
  const afterRestart = loadSimulation(root, sim.id);
  assert.equal(afterRestart.turns.length, 1);
  await runNextTurn(root, sim.id, actorRunner);
  const replay = simulationReplay(root, sim.id);
  assert.equal(replay.status, "completed");
  assert.deepEqual(seen, [
    { characterId: "mara", history: 0 },
    { characterId: "oren", history: 1 },
  ]);
  assert.equal(replay.transcript.length, 2);
  assert.equal(replay.privateTurns.length, 2);
});
