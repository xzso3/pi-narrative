import fs from "node:fs";
import { assertSafeId, buildActorContext, loadScene, narrativePath, readJson, validateScene, writeJsonAtomic } from "./core.js";
import {
  actorMutableStateView,
  commitNarrativeEvent,
  findNarrativeEvent,
  loadNarrativeState,
} from "./state-engine.js";
import { evaluateSceneGate } from "./semantics.js";

export const ACTOR_RESPONSE_PROTOCOL = "pi-narrative.actor-response/v0.4";
export const SIMULATION_PROTOCOL = "pi-narrative.simulation/v0.4";

export function validateActorResponse(response) {
  const errors = [];
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return { valid: false, errors: ["ActorResponse must be an object."] };
  }
  for (const key of ["intent", "action"]) {
    if (typeof response[key] !== "string" || !response[key].trim()) errors.push(`${key} must be a non-empty string.`);
  }
  if (response.dialogue != null && typeof response.dialogue !== "string") errors.push("dialogue must be a string when provided.");
  if (response.rationale != null && typeof response.rationale !== "string") errors.push("rationale must be a string when provided.");
  if (response.emotionalShift != null && (typeof response.emotionalShift !== "object" || Array.isArray(response.emotionalShift))) {
    errors.push("emotionalShift must be an object when provided.");
  }
  return { valid: errors.length === 0, errors };
}

export function publicTurnView(turn) {
  return {
    turn: turn.turn,
    characterId: turn.characterId,
    attemptedAction: turn.action,
    ...(turn.dialogue ? { dialogue: turn.dialogue } : {}),
    ...(turn.resolution ? {
      resolution: {
        outcome: turn.resolution.outcome,
        observableResult: turn.resolution.observableResult,
      },
    } : {}),
  };
}

export function buildActorTurnContext(projectRoot, simulation) {
  const characterId = nextActorId(simulation);
  if (!characterId) throw new Error("Simulation has no next actor.");
  const base = buildActorContext(projectRoot, characterId, simulation.sceneId);
  return {
    protocol: "pi-narrative.actor-turn-context/v0.4",
    ...base,
    mutableState: actorMutableStateView(projectRoot, characterId),
    simulation: {
      id: simulation.id,
      turn: simulation.turns.length + 1,
      maxTurns: simulation.maxTurns,
      perceivedHistory: simulation.turns.map(publicTurnView),
    },
    responseContract: {
      protocol: ACTOR_RESPONSE_PROTOCOL,
      required: ["intent", "action"],
      optional: ["dialogue", "rationale", "emotionalShift"],
      semantics: "action is an attempted action, not a guaranteed world fact. The Arbiter resolves consequences after this response.",
      privacy: "intent, rationale, and emotionalShift remain private and are never exposed to other Actors.",
    },
  };
}

export function buildArbiterContext(projectRoot, simulation, characterId, response) {
  const scene = loadScene(projectRoot, simulation.sceneId);
  const state = loadNarrativeState(projectRoot);
  return {
    protocol: "pi-narrative.arbiter-context/v0.4",
    simulation: { id: simulation.id, turn: simulation.turns.length + 1, sceneId: simulation.sceneId },
    scene: {
      id: scene.id,
      location: scene.location,
      situation: scene.situation,
      publicEvents: scene.publicEvents ?? [],
    },
    actor: {
      characterId,
      attemptedAction: response.action,
      ...(response.dialogue?.trim() ? { dialogue: response.dialogue.trim() } : {}),
    },
    currentState: state,
    rules: [
      "The attempted action is not automatically true.",
      "Resolve only from current state and public scene conditions; do not optimize for story or future plot.",
      "Return the smallest durable state deltas justified by the observable result.",
      "Never expose actor intent, rationale, emotionalShift, or author-only future information.",
    ],
  };
}

export function createSimulation(projectRoot, sceneId, options = {}) {
  const check = validateScene(projectRoot, sceneId);
  if (!check.valid) throw new Error(`Cannot start invalid scene: ${check.errors.join("; ")}`);
  const gate = evaluateSceneGate(projectRoot, sceneId);
  if (!gate.entry) throw new Error(`Cannot start scene '${sceneId}': entry condition is not satisfied.`);
  const scene = loadScene(projectRoot, sceneId);
  const maxTurns = Number.isInteger(options.maxTurns) && options.maxTurns > 0 ? options.maxTurns : Math.max(scene.cast.length * 3, 1);
  const id = options.id || `${sceneId}-${Date.now()}`;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) throw new Error("Simulation id may contain only letters, numbers, dot, underscore, and hyphen.");
  const filePath = narrativePath(projectRoot, "simulations", `${id}.json`);
  if (fs.existsSync(filePath)) throw new Error(`Simulation '${id}' already exists.`);
  const simulation = {
    protocol: SIMULATION_PROTOCOL,
    id,
    sceneId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "running",
    maxTurns,
    turnOrder: [...scene.cast],
    turns: [],
  };
  writeJsonAtomic(filePath, simulation);
  return simulation;
}

export function loadSimulation(projectRoot, simulationId) {
  assertSafeId(simulationId, "Simulation id");
  return readJson(narrativePath(projectRoot, "simulations", `${simulationId}.json`));
}

export function nextActorId(simulation) {
  if (simulation.status !== "running") return null;
  if (simulation.turns.length >= simulation.maxTurns) return null;
  const order = simulation.turnOrder ?? [];
  if (!order.length) return null;
  return order[simulation.turns.length % order.length];
}

function makeTurn(simulation, characterId, response, resolution) {
  return {
    protocol: ACTOR_RESPONSE_PROTOCOL,
    turn: simulation.turns.length + 1,
    characterId,
    intent: response.intent.trim(),
    action: response.action.trim(),
    ...(response.dialogue?.trim() ? { dialogue: response.dialogue.trim() } : {}),
    ...(response.rationale?.trim() ? { rationale: response.rationale.trim() } : {}),
    ...(response.emotionalShift ? { emotionalShift: response.emotionalShift } : {}),
    ...(resolution ? { resolution } : {}),
    recordedAt: new Date().toISOString(),
  };
}

function persistTurn(projectRoot, simulation, turn) {
  simulation.turns.push(turn);
  simulation.updatedAt = new Date().toISOString();
  if (simulation.turns.length >= simulation.maxTurns) {
    simulation.status = "completed";
    simulation.completedAt = simulation.updatedAt;
  }
  writeJsonAtomic(narrativePath(projectRoot, "simulations", `${simulation.id}.json`), simulation);
  return { simulation, turn, nextActorId: nextActorId(simulation) };
}

export function appendActorTurn(projectRoot, simulationId, characterId, response) {
  const simulation = loadSimulation(projectRoot, simulationId);
  if (simulation.status !== "running") throw new Error(`Simulation '${simulationId}' is not running.`);
  const expected = nextActorId(simulation);
  if (!expected) throw new Error(`Simulation '${simulationId}' has no remaining turns.`);
  if (characterId !== expected) throw new Error(`Expected Actor '${expected}', received '${characterId}'.`);
  const check = validateActorResponse(response);
  if (!check.valid) throw new Error(`Invalid ActorResponse: ${check.errors.join("; ")}`);
  return persistTurn(projectRoot, simulation, makeTurn(simulation, characterId, response, null));
}

export async function runNextTurn(projectRoot, simulationId, actorRunner) {
  const simulation = loadSimulation(projectRoot, simulationId);
  const characterId = nextActorId(simulation);
  if (!characterId) return { simulation, turn: null, nextActorId: null };
  const context = buildActorTurnContext(projectRoot, simulation);
  const response = await actorRunner({ characterId, context, simulation });
  return appendActorTurn(projectRoot, simulationId, characterId, response);
}

export async function runNextResolvedTurn(projectRoot, simulationId, actorRunner, arbiterRunner) {
  let simulation = loadSimulation(projectRoot, simulationId);
  const characterId = nextActorId(simulation);
  if (!characterId) return { simulation, turn: null, nextActorId: null, state: loadNarrativeState(projectRoot) };
  const turnNumber = simulation.turns.length + 1;
  const eventId = `${simulation.id}-turn-${turnNumber}`;

  const existingEvent = findNarrativeEvent(projectRoot, eventId);
  if (existingEvent) {
    if (existingEvent.simulationId !== simulation.id || existingEvent.turn !== turnNumber || existingEvent.characterId !== characterId) {
      throw new Error(`Cannot recover turn ${turnNumber}: event '${eventId}' does not match the pending simulation turn.`);
    }
    if (!existingEvent.privateActorResponse) throw new Error(`Cannot recover turn ${turnNumber}: event '${eventId}' has no privateActorResponse.`);
    const resolution = {
      eventId: existingEvent.id,
      outcome: existingEvent.outcome,
      observableResult: existingEvent.observableResult,
      deltas: existingEvent.deltas,
      stateRevisionAfter: existingEvent.revisionAfter,
    };
    const turn = makeTurn(simulation, characterId, existingEvent.privateActorResponse, resolution);
    return { ...persistTurn(projectRoot, simulation, turn), state: loadNarrativeState(projectRoot), recovered: true };
  }

  const actorContext = buildActorTurnContext(projectRoot, simulation);
  const response = await actorRunner({ characterId, context: actorContext, simulation });
  const actorCheck = validateActorResponse(response);
  if (!actorCheck.valid) throw new Error(`Invalid ActorResponse: ${actorCheck.errors.join("; ")}`);

  const arbiterContext = buildArbiterContext(projectRoot, simulation, characterId, response);
  const decision = await arbiterRunner({ characterId, context: arbiterContext, response, simulation });
  const committed = commitNarrativeEvent(projectRoot, {
    id: eventId,
    simulationId: simulation.id,
    turn: turnNumber,
    characterId,
    baseRevision: arbiterContext.currentState.revision,
    actorResponse: response,
    decision,
  });

  simulation = loadSimulation(projectRoot, simulationId);
  const resolution = {
    eventId: committed.event.id,
    outcome: committed.event.outcome,
    observableResult: committed.event.observableResult,
    deltas: committed.event.deltas,
    stateRevisionAfter: committed.event.revisionAfter,
  };
  const turn = makeTurn(simulation, characterId, response, resolution);
  return { ...persistTurn(projectRoot, simulation, turn), state: committed.state, recovered: false };
}

export function simulationReplay(projectRoot, simulationId) {
  const simulation = loadSimulation(projectRoot, simulationId);
  return {
    id: simulation.id,
    sceneId: simulation.sceneId,
    status: simulation.status,
    maxTurns: simulation.maxTurns,
    nextActorId: nextActorId(simulation),
    stateRevision: loadNarrativeState(projectRoot).revision,
    transcript: simulation.turns.map(publicTurnView),
    privateTurns: simulation.turns,
  };
}
