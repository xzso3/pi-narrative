import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  applyChoice,
  availableChoices,
  evaluateChoice,
  evaluateCondition,
  evaluateQuest,
  evaluateSceneGate,
  evaluateTimeline,
  gameplayConsequences,
  narrativeFlowSnapshot,
  resolveBranches,
  validateCondition,
} from "../src/semantics.js";
import { createSimulation } from "../src/runtime.js";
import { commitNarrativeEvent, listNarrativeEvents, loadNarrativeState } from "../src/state-engine.js";

const fixture = path.resolve("examples/roadside-station");
function tmpProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-narrative-v04-semantics-"));
  fs.cpSync(fixture, tmp, { recursive: true });
  return tmp;
}

test("declarative conditions evaluate state without arbitrary expressions", () => {
  const root = tmpProject();
  const condition = {
    op: "all",
    conditions: [
      { op: "compare", path: "characters.mara.resources.fuelLiters", comparator: "eq", value: 2 },
      { op: "not", condition: { op: "compare", path: "world.flags.departedNorth", comparator: "eq", value: true } },
    ],
  };
  assert.equal(validateCondition(condition).valid, true);
  const result = evaluateCondition(root, condition);
  assert.equal(result.value, true);
  assert.equal(result.stateRevision, 0);
  assert.equal(validateCondition({ op: "eval", expression: "process.exit()" }).valid, false);
});

test("scene entry gates block locked scenes before simulation starts", () => {
  const root = tmpProject();
  assert.equal(evaluateSceneGate(root, "fuel-bargain").entry, true);
  assert.equal(evaluateSceneGate(root, "north-road").entry, false);
  assert.throws(() => createSimulation(root, "north-road", { id: "too-early" }), /entry condition/);
});

test("authored choice commits deterministic effects and unlocks a branch", () => {
  const root = tmpProject();
  const choices = availableChoices(root, { sceneId: "fuel-bargain" });
  assert.equal(choices.length, 1);
  assert.equal(choices[0].id, "departure");
  assert.equal(choices[0].options.every((option) => option.available), true);

  const result = applyChoice(root, "departure", "trade-medicine-for-fuel", { expectedRevision: 0 });
  assert.equal(result.state.revision, 1);
  assert.equal(result.state.characters.mara.resources.fuelLiters, 12);
  assert.equal(result.state.characters.mara.resources.medicineDoses, 0);
  assert.equal(result.state.characters.oren.resources.fuelLiters, 25);
  assert.equal(result.state.world.flags.departedNorth, true);
  assert.equal(result.event.source.type, "choice");
  assert.equal(result.event.source.choiceId, "departure");
  assert.deepEqual(result.branches.map((branch) => branch.targetSceneId), ["north-road"]);
  assert.equal(evaluateSceneGate(root, "north-road").entry, true);
  assert.doesNotThrow(() => createSimulation(root, "north-road", { id: "after-trade", maxTurns: 1 }));
});

test("single-use choices cannot be selected twice", () => {
  const root = tmpProject();
  applyChoice(root, "departure", "accept-shelter");
  assert.equal(evaluateChoice(root, "departure").available, false);
  assert.throws(() => applyChoice(root, "departure", "trade-medicine-for-fuel"), /not currently available/);
});

test("alternative choice unlocks the shelter branch without granting fuel", () => {
  const root = tmpProject();
  const result = applyChoice(root, "departure", "accept-shelter");
  assert.equal(result.state.characters.mara.resources.fuelLiters, 2);
  assert.equal(result.state.characters.mara.resources.medicineDoses, 1);
  assert.equal(result.state.world.flags.shelterAccepted, true);
  assert.deepEqual(resolveBranches(root, "fuel-bargain").map((branch) => branch.targetSceneId), ["storm-shelter"]);
  assert.equal(evaluateSceneGate(root, "storm-shelter").entry, true);
});

test("quest objectives derive locked/active/completed state from predicates", () => {
  const root = tmpProject();
  const before = evaluateQuest(root, "survive-mile-83");
  assert.equal(before.status, "active");
  assert.equal(before.objectives[0].status, "active");
  assert.equal(before.objectives[1].status, "locked");

  applyChoice(root, "departure", "trade-medicine-for-fuel");
  const after = evaluateQuest(root, "survive-mile-83");
  assert.equal(after.status, "completed");
  assert.equal(after.objectives.every((objective) => objective.status === "completed"), true);
});

test("timeline constraints can detect impossible ordering/state continuity", () => {
  const root = tmpProject();
  assert.equal(evaluateTimeline(root).valid, true);
  commitNarrativeEvent(root, {
    id: "force-north-without-fuel",
    baseRevision: 0,
    source: { type: "system", sourceId: "test" },
    decision: {
      outcome: "accepted",
      observableResult: "A test flag marks Mara as departed.",
      deltas: [{ type: "state", scope: "world", key: "departedNorth", op: "set", value: true }],
    },
  });
  const report = evaluateTimeline(root);
  assert.equal(report.valid, false);
  assert.equal(report.constraints[0].status, "violated");
});

test("event-before constraints use append-only event order", () => {
  const root = tmpProject();
  const timelinePath = path.join(root, "narrative/timeline.json");
  fs.writeFileSync(timelinePath, JSON.stringify({
    protocol: "pi-narrative.timeline/v0.4",
    constraints: [{
      id: "a-before-b",
      type: "event-before",
      first: { eventId: "event-a" },
      second: { eventId: "event-b" },
    }],
  }, null, 2));
  commitNarrativeEvent(root, {
    id: "event-b", baseRevision: 0, source: { type: "system", sourceId: "b" },
    decision: { outcome: "accepted", observableResult: "B happens first.", deltas: [] },
  });
  commitNarrativeEvent(root, {
    id: "event-a", baseRevision: 1, source: { type: "system", sourceId: "a" },
    decision: { outcome: "accepted", observableResult: "A happens second.", deltas: [] },
  });
  const report = evaluateTimeline(root);
  assert.equal(report.valid, false);
  assert.equal(report.constraints[0].status, "violated");
});

test("event selector conditions can query semantic history", () => {
  const root = tmpProject();
  applyChoice(root, "departure", "accept-shelter");
  const condition = {
    op: "event",
    selector: { sourceType: "choice", choiceId: "departure", optionId: "accept-shelter" },
  };
  const result = evaluateCondition(root, condition);
  assert.equal(result.value, true);
  assert.equal(result.trace.matchingEventIds.length, 1);
});

test("choice effects still obey deterministic StateDelta validation and revision checks", () => {
  const root = tmpProject();
  assert.throws(
    () => applyChoice(root, "departure", "trade-medicine-for-fuel", { expectedRevision: 9 }),
    /revision conflict/,
  );
  assert.equal(loadNarrativeState(root).revision, 0);
});

test("gameplay consequences are persisted as engine-facing semantic outputs", () => {
  const root = tmpProject();
  applyChoice(root, "departure", "trade-medicine-for-fuel");
  const consequences = gameplayConsequences(root);
  assert.equal(consequences.length, 2);
  assert.ok(consequences.some((item) => item.type === "unlock-route" && item.id === "north-road"));
  assert.ok(listNarrativeEvents(root)[0].gameplayConsequences.length === 2);
});

test("flow snapshot combines gates, choices, quests, branches, timeline, and gameplay outputs", () => {
  const root = tmpProject();
  const before = narrativeFlowSnapshot(root, { sceneId: "fuel-bargain" });
  assert.equal(before.sceneGate.entry, true);
  assert.equal(before.choices.length, 1);
  assert.equal(before.quests[0].status, "active");
  assert.deepEqual(before.branches, []);

  applyChoice(root, "departure", "accept-shelter");
  const after = narrativeFlowSnapshot(root, { sceneId: "fuel-bargain" });
  assert.equal(after.sceneGate.exit, true);
  assert.deepEqual(after.branches.map((branch) => branch.targetSceneId), ["storm-shelter"]);
  assert.equal(after.quests[0].status, "completed");
  assert.equal(after.gameplayConsequences.length, 2);
});

test("event selectors reject unknown fields instead of matching every event", () => {
  const root = tmpProject();
  commitNarrativeEvent(root, {
    id: "real-event", baseRevision: 0, source: { type: "system", sourceId: "test" },
    decision: { outcome: "accepted", observableResult: "A real event exists.", deltas: [] },
  });
  assert.equal(validateCondition({ op: "event", selector: { typoChoice: "departure" } }).valid, false);
  assert.throws(
    () => evaluateCondition(root, { op: "event", selector: { typoChoice: "departure" } }),
    /Invalid narrative condition/,
  );
});
