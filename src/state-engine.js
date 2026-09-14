import fs from "node:fs";
import path from "node:path";
import { loadCharacter, loadWorld, narrativePath, readJson, writeJsonAtomic } from "./core.js";

export const STATE_PROTOCOL = "pi-narrative.state/v0.3";
export const DELTA_PROTOCOL = "pi-narrative.state-delta/v0.3";
export const EVENT_PROTOCOL = "pi-narrative.event/v0.4";
export const ARBITER_DECISION_PROTOCOL = "pi-narrative.arbiter-decision/v0.3";

const stateDir = (projectRoot) => narrativePath(projectRoot, "state");
const initialPath = (projectRoot) => path.join(stateDir(projectRoot), "initial.json");
const currentPath = (projectRoot) => path.join(stateDir(projectRoot), "current.json");
const eventsDir = (projectRoot) => narrativePath(projectRoot, "events");

function clone(value) {
  return structuredClone(value);
}

function ensureStateShape(state) {
  return {
    protocol: STATE_PROTOCOL,
    revision: Number.isInteger(state?.revision) ? state.revision : 0,
    characters: state?.characters ?? {},
    world: state?.world ?? { flags: {} },
  };
}

export function validateInitialState(projectRoot, input) {
  const state = ensureStateShape(input);
  const errors = [];
  if (state.revision !== 0) errors.push("Initial state revision must be 0.");
  for (const [characterId, value] of Object.entries(state.characters ?? {})) {
    if (!characterExists(projectRoot, characterId)) errors.push(`Initial state references unknown character '${characterId}'.`);
    for (const [resourceId, amount] of Object.entries(value.resources ?? {})) {
      if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
        errors.push(`Initial resource '${characterId}.${resourceId}' must be a finite non-negative number.`);
      }
    }
    for (const [targetId, metrics] of Object.entries(value.relationships ?? {})) {
      if (!characterExists(projectRoot, targetId)) errors.push(`Initial relationship references unknown character '${targetId}'.`);
      for (const [metric, score] of Object.entries(metrics ?? {})) {
        if (typeof score !== "number" || !Number.isFinite(score) || score < -1 || score > 1) {
          errors.push(`Initial relationship '${characterId}->${targetId}.${metric}' must be within [-1, 1].`);
        }
      }
    }
    for (const factId of value.knowledge?.factIds ?? []) {
      if (!worldFactExists(projectRoot, factId)) errors.push(`Initial knowledge contains unknown or actor-invisible fact '${factId}'.`);
    }
  }
  return { valid: errors.length === 0, errors, state };
}

export function loadInitialState(projectRoot) {
  const raw = fs.existsSync(initialPath(projectRoot)) ? readJson(initialPath(projectRoot)) : { revision: 0 };
  const check = validateInitialState(projectRoot, raw);
  if (!check.valid) throw new Error(`Invalid initial narrative state: ${check.errors.join("; ")}`);
  return check.state;
}

export function listNarrativeEvents(projectRoot) {
  const dir = eventsDir(projectRoot);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(path.join(dir, name)));
}


export function findNarrativeEvent(projectRoot, eventId) {
  return listNarrativeEvents(projectRoot).find((event) => event.id === eventId) ?? null;
}

function characterExists(projectRoot, characterId) {
  try {
    loadCharacter(projectRoot, characterId);
    return true;
  } catch {
    return false;
  }
}

function worldFactExists(projectRoot, factId) {
  try {
    return (loadWorld(projectRoot).facts ?? []).some((fact) => fact.id === factId && fact.actorVisible !== false);
  } catch {
    return false;
  }
}

export function validateStateDelta(projectRoot, state, delta) {
  const errors = [];
  if (!delta || typeof delta !== "object" || Array.isArray(delta)) {
    return { valid: false, errors: ["StateDelta must be an object."] };
  }

  const numericOp = (kind) => {
    if (!['increment', 'set'].includes(delta.op)) errors.push(`${kind}.op must be 'increment' or 'set'.`);
    if (typeof delta.value !== "number" || !Number.isFinite(delta.value)) errors.push(`${kind}.value must be a finite number.`);
  };

  switch (delta.type) {
    case "resource": {
      if (!characterExists(projectRoot, delta.characterId)) errors.push(`Unknown character '${delta.characterId}'.`);
      if (typeof delta.resourceId !== "string" || !delta.resourceId.trim()) errors.push("resource.resourceId is required.");
      numericOp("resource");
      const current = state.characters?.[delta.characterId]?.resources?.[delta.resourceId] ?? 0;
      const next = delta.op === "increment" ? current + delta.value : delta.value;
      if (next < 0) errors.push(`Resource '${delta.resourceId}' for '${delta.characterId}' cannot become negative.`);
      break;
    }
    case "relationship": {
      if (!characterExists(projectRoot, delta.fromCharacterId)) errors.push(`Unknown character '${delta.fromCharacterId}'.`);
      if (!characterExists(projectRoot, delta.toCharacterId)) errors.push(`Unknown character '${delta.toCharacterId}'.`);
      if (typeof delta.metric !== "string" || !delta.metric.trim()) errors.push("relationship.metric is required.");
      numericOp("relationship");
      const current = state.characters?.[delta.fromCharacterId]?.relationships?.[delta.toCharacterId]?.[delta.metric] ?? 0;
      const next = delta.op === "increment" ? current + delta.value : delta.value;
      if (next < -1 || next > 1) errors.push(`Relationship metric '${delta.metric}' must remain within [-1, 1].`);
      break;
    }
    case "knowledge": {
      if (!characterExists(projectRoot, delta.characterId)) errors.push(`Unknown character '${delta.characterId}'.`);
      if (delta.op !== "add") errors.push("knowledge.op must be 'add' in v0.3.");
      if (!worldFactExists(projectRoot, delta.factId)) errors.push(`Unknown or actor-invisible world fact '${delta.factId}'.`);
      break;
    }
    case "state": {
      if (!['character', 'world'].includes(delta.scope)) errors.push("state.scope must be 'character' or 'world'.");
      if (delta.scope === "character" && !characterExists(projectRoot, delta.characterId)) {
        errors.push(`Unknown character '${delta.characterId}'.`);
      }
      if (typeof delta.key !== "string" || !delta.key.trim()) errors.push("state.key is required.");
      if (!['set', 'increment'].includes(delta.op)) errors.push("state.op must be 'set' or 'increment'.");
      if (delta.op === "increment" && (typeof delta.value !== "number" || !Number.isFinite(delta.value))) {
        errors.push("state increment requires a finite numeric value.");
      }
      if (delta.op === "set" && !["number", "string", "boolean"].includes(typeof delta.value)) {
        errors.push("state set requires a number, string, or boolean value in v0.3.");
      }
      if (delta.op === "set" && typeof delta.value === "number" && !Number.isFinite(delta.value)) {
        errors.push("state set numeric value must be finite.");
      }
      if (delta.op === "increment") {
        const current = delta.scope === "world"
          ? state.world?.flags?.[delta.key]
          : state.characters?.[delta.characterId]?.attributes?.[delta.key];
        if (current != null && (typeof current !== "number" || !Number.isFinite(current))) {
          errors.push(`state '${delta.key}' cannot be incremented because its current value is not numeric.`);
        }
      }
      break;
    }
    default:
      errors.push(`Unsupported StateDelta type '${delta.type}'.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateArbiterDecision(projectRoot, state, decision) {
  const errors = [];
  if (!decision || typeof decision !== "object" || Array.isArray(decision)) {
    return { valid: false, errors: ["ArbiterDecision must be an object."] };
  }
  if (!["accepted", "rejected", "partial"].includes(decision.outcome)) {
    errors.push("outcome must be accepted, rejected, or partial.");
  }
  if (typeof decision.observableResult !== "string" || !decision.observableResult.trim()) {
    errors.push("observableResult must be a non-empty string.");
  }
  if (!Array.isArray(decision.deltas)) errors.push("deltas must be an array.");

  // Validate each delta against the preview produced by all earlier valid deltas.
  // This closes compound-update bypasses such as two individually legal decrements
  // that would become negative when applied together.
  let preview = state;
  for (const [index, delta] of (decision.deltas ?? []).entries()) {
    const check = validateStateDelta(projectRoot, preview, delta);
    for (const error of check.errors) errors.push(`deltas[${index}]: ${error}`);
    if (check.valid) preview = applyStateDelta(preview, delta);
  }
  if (decision.outcome === "rejected" && (decision.deltas?.length ?? 0) > 0) {
    errors.push("A rejected action cannot apply state deltas in v0.3+.");
  }
  return { valid: errors.length === 0, errors };
}

export function applyStateDelta(state, delta) {
  const next = clone(state);
  next.characters ??= {};
  next.world ??= { flags: {} };

  if (delta.type === "resource") {
    const character = next.characters[delta.characterId] ??= {};
    character.resources ??= {};
    const current = character.resources[delta.resourceId] ?? 0;
    character.resources[delta.resourceId] = delta.op === "increment" ? current + delta.value : delta.value;
  } else if (delta.type === "relationship") {
    const character = next.characters[delta.fromCharacterId] ??= {};
    character.relationships ??= {};
    const target = character.relationships[delta.toCharacterId] ??= {};
    const current = target[delta.metric] ?? 0;
    target[delta.metric] = delta.op === "increment" ? current + delta.value : delta.value;
  } else if (delta.type === "knowledge") {
    const character = next.characters[delta.characterId] ??= {};
    character.knowledge ??= { factIds: [] };
    character.knowledge.factIds ??= [];
    if (!character.knowledge.factIds.includes(delta.factId)) character.knowledge.factIds.push(delta.factId);
  } else if (delta.type === "state") {
    const target = delta.scope === "world"
      ? (next.world.flags ??= {})
      : ((next.characters[delta.characterId] ??= {}).attributes ??= {});
    if (delta.op === "increment") target[delta.key] = (target[delta.key] ?? 0) + delta.value;
    else target[delta.key] = delta.value;
  }
  return next;
}

function applyEventUnchecked(state, event) {
  let next = clone(state);
  for (const delta of event.deltas ?? []) next = applyStateDelta(next, delta);
  next.protocol = STATE_PROTOCOL;
  next.revision = event.revisionAfter;
  return next;
}

export function replayNarrativeState(projectRoot) {
  let state = loadInitialState(projectRoot);
  let expectedRevision = state.revision;
  const events = listNarrativeEvents(projectRoot);
  for (const event of events) {
    if (event.revisionBefore !== expectedRevision || event.revisionAfter !== expectedRevision + 1) {
      throw new Error(`Event '${event.id}' breaks revision chain at ${expectedRevision}.`);
    }
    const check = validateArbiterDecision(projectRoot, state, {
      outcome: event.outcome,
      observableResult: event.observableResult,
      deltas: event.deltas,
    });
    if (!check.valid) throw new Error(`Event '${event.id}' is invalid during replay: ${check.errors.join("; ")}`);
    state = applyEventUnchecked(state, event);
    expectedRevision = state.revision;
  }
  return state;
}

export function loadNarrativeState(projectRoot) {
  const replayed = replayNarrativeState(projectRoot);
  const cachePath = currentPath(projectRoot);
  if (!fs.existsSync(cachePath) || readJson(cachePath).revision !== replayed.revision) {
    writeJsonAtomic(cachePath, replayed);
  }
  return replayed;
}

export function actorMutableStateView(projectRoot, characterId) {
  const state = loadNarrativeState(projectRoot);
  const character = state.characters?.[characterId] ?? {};
  const visibleFactIds = new Set(
    (loadWorld(projectRoot).facts ?? []).filter((fact) => fact.actorVisible !== false).map((fact) => fact.id),
  );
  return {
    revision: state.revision,
    attributes: character.attributes ?? {},
    resources: character.resources ?? {},
    relationships: character.relationships ?? {},
    knowledge: { factIds: (character.knowledge?.factIds ?? []).filter((id) => visibleFactIds.has(id)) },
    worldFlags: state.world?.flags ?? {},
  };
}

function normalizeEventSource(input) {
  if (input.source) {
    if (!input.source.type || !["actor-turn", "choice", "system"].includes(input.source.type)) {
      throw new Error("NarrativeEvent source.type must be actor-turn, choice, or system.");
    }
    if (input.source.type === "actor-turn") {
      if (!input.source.simulationId || !Number.isInteger(input.source.turn) || !input.source.characterId) {
        throw new Error("actor-turn source requires simulationId, turn, and characterId.");
      }
    }
    if (input.source.type === "choice" && (!input.source.choiceId || !input.source.optionId)) {
      throw new Error("choice source requires choiceId and optionId.");
    }
    return input.source;
  }
  if (input.simulationId && Number.isInteger(input.turn) && input.characterId) {
    return {
      type: "actor-turn",
      simulationId: input.simulationId,
      turn: input.turn,
      characterId: input.characterId,
    };
  }
  return { type: "system", ...(input.sourceId ? { sourceId: input.sourceId } : {}) };
}

export function commitNarrativeEvent(projectRoot, input) {
  const state = loadNarrativeState(projectRoot);
  if (input.baseRevision != null && input.baseRevision !== state.revision) {
    throw new Error(`State revision conflict: expected ${input.baseRevision}, current ${state.revision}.`);
  }
  if (!input.id) throw new Error("NarrativeEvent requires id.");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(input.id)) {
    throw new Error("NarrativeEvent id may contain only letters, numbers, dot, underscore, and hyphen.");
  }
  if (listNarrativeEvents(projectRoot).some((event) => event.id === input.id)) {
    throw new Error(`NarrativeEvent '${input.id}' already exists.`);
  }

  const source = normalizeEventSource(input);
  const check = validateArbiterDecision(projectRoot, state, input.decision);
  if (!check.valid) throw new Error(`Invalid ArbiterDecision: ${check.errors.join("; ")}`);

  const revisionAfter = state.revision + 1;
  const event = {
    protocol: EVENT_PROTOCOL,
    id: input.id,
    source,
    ...(source.type === "actor-turn" ? {
      simulationId: source.simulationId,
      turn: source.turn,
      characterId: source.characterId,
    } : {}),
    revisionBefore: state.revision,
    revisionAfter,
    outcome: input.decision.outcome,
    observableResult: input.decision.observableResult.trim(),
    ...(input.decision.reason?.trim() ? { reason: input.decision.reason.trim() } : {}),
    ...(input.actorResponse ? { privateActorResponse: input.actorResponse } : {}),
    deltas: input.decision.deltas ?? [],
    ...(Array.isArray(input.gameplayConsequences) && input.gameplayConsequences.length > 0
      ? { gameplayConsequences: input.gameplayConsequences }
      : {}),
    createdAt: new Date().toISOString(),
  };

  const fileName = `${String(revisionAfter).padStart(6, "0")}-${input.id}.json`;
  writeJsonAtomic(path.join(eventsDir(projectRoot), fileName), event);
  const next = replayNarrativeState(projectRoot);
  writeJsonAtomic(currentPath(projectRoot), next);
  return { event, state: next };
}
