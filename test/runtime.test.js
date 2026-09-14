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

import { commitNarrativeEvent } from "../src/state-engine.js";
import { runNextResolvedTurn } from "../src/runtime.js";

test("resolved turns treat Actor action as attempt and Arbiter result as world truth", async () => {
  const root = tmpProject();
  const sim = createSimulation(root, "fuel-bargain", { id: "resolved", maxTurns: 2 });
  const actorRunner = async ({ characterId }) => ({
    intent: "secure fuel",
    action: "takes five liters from Oren's stock",
    dialogue: "Five liters. Fair?",
    rationale: "Needs enough to move.",
  });
  const arbiterRunner = async () => ({
    outcome: "accepted",
    observableResult: "Oren unlocks the pump and five liters flow into Mara's tank.",
    reason: "Oren permits the transfer.",
    deltas: [
      { type: "resource", characterId: "oren", resourceId: "fuelLiters", op: "increment", value: -5 },
      { type: "resource", characterId: "mara", resourceId: "fuelLiters", op: "increment", value: 5 }
    ]
  });

  const result = await runNextResolvedTurn(root, sim.id, actorRunner, arbiterRunner);
  assert.equal(result.turn.resolution.outcome, "accepted");
  assert.equal(result.state.characters.mara.resources.fuelLiters, 7);
  assert.equal(result.state.characters.oren.resources.fuelLiters, 30);

  const nextContext = buildActorTurnContext(root, loadSimulation(root, sim.id));
  const visible = JSON.stringify(nextContext.simulation.perceivedHistory);
  assert.match(visible, /five liters flow/);
  assert.match(visible, /takes five liters/);
  assert.doesNotMatch(visible, /Needs enough to move/);
  assert.doesNotMatch(visible, /Oren permits the transfer/);
  assert.equal(nextContext.mutableState.revision, 1);
});

test("resolved turn can recover from event committed before simulation transcript", async () => {
  const root = tmpProject();
  const sim = createSimulation(root, "fuel-bargain", { id: "recover", maxTurns: 1 });
  const actorResponse = { intent: "wait", action: "holds out an empty fuel can" };
  commitNarrativeEvent(root, {
    id: "recover-turn-1",
    simulationId: "recover",
    turn: 1,
    characterId: "mara",
    baseRevision: 0,
    actorResponse,
    decision: { outcome: "rejected", observableResult: "Oren does not open the pump.", deltas: [] }
  });
  let called = false;
  const result = await runNextResolvedTurn(
    root,
    sim.id,
    async () => { called = true; throw new Error("actor should not run"); },
    async () => { called = true; throw new Error("arbiter should not run"); },
  );
  assert.equal(called, false);
  assert.equal(result.recovered, true);
  assert.equal(result.turn.resolution.observableResult, "Oren does not open the pump.");
  assert.equal(result.simulation.status, "completed");
});
