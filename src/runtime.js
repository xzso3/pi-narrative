import fs from "node:fs";
import { buildActorContext, loadScene, narrativePath, readJson, validateScene, writeJsonAtomic } from "./core.js";

export const ACTOR_RESPONSE_PROTOCOL = "pi-narrative.actor-response/v0.2";
export const SIMULATION_PROTOCOL = "pi-narrative.simulation/v0.2";

export function validateActorResponse(response) {
  const errors = [];
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return { valid: false, errors: ["ActorResponse must be an object."] };
  }
  for (const key of ["intent", "action"]) {
    if (typeof response[key] !== "string" || !response[key].trim()) {
      errors.push(`${key} must be a non-empty string.`);
    }
  }
  if (response.dialogue != null && typeof response.dialogue !== "string") {
    errors.push("dialogue must be a string when provided.");
  }
  if (response.rationale != null && typeof response.rationale !== "string") {
    errors.push("rationale must be a string when provided.");
  }
  if (response.emotionalShift != null && (typeof response.emotionalShift !== "object" || Array.isArray(response.emotionalShift))) {
    errors.push("emotionalShift must be an object when provided.");
  }
  return { valid: errors.length === 0, errors };
}

export function publicTurnView(turn) {
  return {
    turn: turn.turn,
    characterId: turn.characterId,
    action: turn.action,
    ...(turn.dialogue ? { dialogue: turn.dialogue } : {}),
  };
}

export function buildActorTurnContext(projectRoot, simulation) {
  const characterId = nextActorId(simulation);
  if (!characterId) throw new Error("Simulation has no next actor.");
  const base = buildActorContext(projectRoot, characterId, simulation.sceneId);
  return {
    protocol: "pi-narrative.actor-turn-context/v0.2",
    ...base,
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
      privacy: "intent, rationale, and emotionalShift remain private to the simulation record and are never exposed to other Actors.",
    },
  };
}

export function createSimulation(projectRoot, sceneId, options = {}) {
  const check = validateScene(projectRoot, sceneId);
  if (!check.valid) throw new Error(`Cannot start invalid scene: ${check.errors.join("; ")}`);
  const scene = loadScene(projectRoot, sceneId);
  const maxTurns = Number.isInteger(options.maxTurns) && options.maxTurns > 0 ? options.maxTurns : Math.max(scene.cast.length * 3, 1);
  const id = options.id || `${sceneId}-${Date.now()}`;
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
  return readJson(narrativePath(projectRoot, "simulations", `${simulationId}.json`));
}

export function nextActorId(simulation) {
  if (simulation.status !== "running") return null;
  if (simulation.turns.length >= simulation.maxTurns) return null;
  const order = simulation.turnOrder ?? [];
  if (!order.length) return null;
  return order[simulation.turns.length % order.length];
}

export function appendActorTurn(projectRoot, simulationId, characterId, response) {
  const simulation = loadSimulation(projectRoot, simulationId);
  if (simulation.status !== "running") throw new Error(`Simulation '${simulationId}' is not running.`);
  const expected = nextActorId(simulation);
  if (!expected) throw new Error(`Simulation '${simulationId}' has no remaining turns.`);
  if (characterId !== expected) throw new Error(`Expected Actor '${expected}', received '${characterId}'.`);

  const check = validateActorResponse(response);
  if (!check.valid) throw new Error(`Invalid ActorResponse: ${check.errors.join("; ")}`);

  const turn = {
    protocol: ACTOR_RESPONSE_PROTOCOL,
    turn: simulation.turns.length + 1,
    characterId,
    intent: response.intent.trim(),
    action: response.action.trim(),
    ...(response.dialogue?.trim() ? { dialogue: response.dialogue.trim() } : {}),
    ...(response.rationale?.trim() ? { rationale: response.rationale.trim() } : {}),
    ...(response.emotionalShift ? { emotionalShift: response.emotionalShift } : {}),
    recordedAt: new Date().toISOString(),
  };

  simulation.turns.push(turn);
  simulation.updatedAt = new Date().toISOString();
  if (simulation.turns.length >= simulation.maxTurns) {
    simulation.status = "completed";
    simulation.completedAt = simulation.updatedAt;
  }
  writeJsonAtomic(narrativePath(projectRoot, "simulations", `${simulationId}.json`), simulation);
  return { simulation, turn, nextActorId: nextActorId(simulation) };
}

export async function runNextTurn(projectRoot, simulationId, actorRunner) {
  const simulation = loadSimulation(projectRoot, simulationId);
  const characterId = nextActorId(simulation);
  if (!characterId) return { simulation, turn: null, nextActorId: null };
  const context = buildActorTurnContext(projectRoot, simulation);
  const response = await actorRunner({ characterId, context, simulation });
  return appendActorTurn(projectRoot, simulationId, characterId, response);
}

export function simulationReplay(projectRoot, simulationId) {
  const simulation = loadSimulation(projectRoot, simulationId);
  return {
    id: simulation.id,
    sceneId: simulation.sceneId,
    status: simulation.status,
    maxTurns: simulation.maxTurns,
    nextActorId: nextActorId(simulation),
    transcript: simulation.turns.map(publicTurnView),
    privateTurns: simulation.turns,
  };
}
