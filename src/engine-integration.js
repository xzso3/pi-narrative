import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { assertSafeId, loadManifest, narrativePath, readJson, writeJsonAtomic } from "./core.js";
import { applyStateDelta, listNarrativeEvents, loadInitialState, loadNarrativeState } from "./state-engine.js";

export const ENGINE_SCHEMA_VERSION = 1;
export const PROJECT_SCHEMA_VERSION = 1;
export const ENGINE_EXPORT_PROTOCOL = "pi-narrative.engine-export/v0.5";
export const ENGINE_ACK_PROTOCOL = "pi-narrative.engine-ack/v0.5";
export const ENGINE_SAVE_PROTOCOL = "pi-narrative.engine-save/v0.5";
export const CHECKPOINT_PROTOCOL = "pi-narrative.checkpoint/v0.5";
export const PROJECT_PROTOCOL = "pi-narrative.project/v1";

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

export function sha256(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : stableStringify(value)).digest("hex");
}

function typedValue(key, value) {
  if (value === null) return { key, type: "null" };
  if (typeof value === "string") return { key, type: "string", stringValue: value };
  if (typeof value === "number" && Number.isFinite(value)) return { key, type: "number", numberValue: value };
  if (typeof value === "boolean") return { key, type: "boolean", booleanValue: value };
  return { key, type: "json", jsonValue: stableStringify(value) };
}

function typedEntries(object = {}) {
  return Object.entries(object).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => typedValue(key, value));
}

export function stateToEngineDto(state) {
  return {
    revision: state.revision,
    characters: Object.entries(state.characters ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([id, character]) => ({
      id,
      attributes: typedEntries(character.attributes ?? {}),
      resources: Object.entries(character.resources ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([resourceId, value]) => ({ id: resourceId, value })),
      relationships: Object.entries(character.relationships ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([targetId, metrics]) => ({
        targetId,
        metrics: Object.entries(metrics ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([id, value]) => ({ id, value })),
      })),
      knowledgeFactIds: [...(character.knowledge?.factIds ?? [])].sort(),
    })),
    worldFlags: typedEntries(state.world?.flags ?? {}),
  };
}

function jsonDirectory(projectRoot, directory) {
  const dir = narrativePath(projectRoot, directory);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort().map((name) => readJson(path.join(dir, name)));
}

export function buildLocalizationCatalog(projectRoot) {
  const entries = [];
  const push = (key, fallback, source) => {
    if (typeof fallback === "string" && fallback.trim()) entries.push({ key, fallback, source });
  };
  for (const scene of jsonDirectory(projectRoot, "scenes")) push(`scene.${scene.id}.title`, scene.title, { type: "scene", id: scene.id, field: "title" });
  for (const choice of jsonDirectory(projectRoot, "choices")) {
    push(`choice.${choice.id}.prompt`, choice.prompt, { type: "choice", id: choice.id, field: "prompt" });
    for (const option of choice.options ?? []) {
      push(`choice.${choice.id}.option.${option.id}.label`, option.label, { type: "choice-option", id: `${choice.id}/${option.id}`, field: "label" });
      push(`choice.${choice.id}.option.${option.id}.outcome`, option.outcomeText, { type: "choice-option", id: `${choice.id}/${option.id}`, field: "outcomeText" });
    }
  }
  for (const quest of jsonDirectory(projectRoot, "quests")) {
    push(`quest.${quest.id}.title`, quest.title, { type: "quest", id: quest.id, field: "title" });
    for (const objective of quest.objectives ?? []) push(`quest.${quest.id}.objective.${objective.id}.title`, objective.title, { type: "objective", id: `${quest.id}/${objective.id}`, field: "title" });
  }
  const keys = new Set();
  for (const entry of entries) {
    if (keys.has(entry.key)) throw new Error(`Duplicate localization key '${entry.key}'.`);
    keys.add(entry.key);
  }
  return entries.sort((a, b) => a.key.localeCompare(b.key));
}

export function consequenceDeliveryId(event, index) {
  if (!event?.id || !Number.isInteger(event?.revisionAfter) || !Number.isInteger(index) || index < 0) throw new Error("Cannot build consequence delivery id from invalid event/index.");
  return `pn-${event.revisionAfter}-${event.id}-${index}`;
}

function consequencePayload(consequence) {
  return Object.entries(consequence ?? {})
    .filter(([key]) => !["type", "id"].includes(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => typedValue(key, value));
}

export function listConsequenceDeliveries(projectRoot) {
  const deliveries = [];
  const ids = new Set();
  for (const event of listNarrativeEvents(projectRoot)) {
    for (const [index, consequence] of (event.gameplayConsequences ?? []).entries()) {
      if (!consequence || typeof consequence !== "object" || typeof consequence.type !== "string" || !consequence.type || typeof consequence.id !== "string" || !consequence.id) {
        throw new Error(`Event '${event.id}' gameplayConsequences[${index}] requires non-empty string type and id.`);
      }
      const deliveryId = consequenceDeliveryId(event, index);
      if (ids.has(deliveryId)) throw new Error(`Duplicate consequence delivery id '${deliveryId}'.`);
      ids.add(deliveryId);
      deliveries.push({
        deliveryId,
        eventId: event.id,
        eventRevision: event.revisionAfter,
        index,
        type: consequence.type,
        id: consequence.id,
        payload: consequencePayload(consequence),
      });
    }
  }
  return deliveries;
}

function consumerDir(projectRoot, consumerId) {
  assertSafeId(consumerId, "Consumer id");
  return narrativePath(projectRoot, "runtime", consumerId);
}

export function loadAckLedger(projectRoot, consumerId) {
  const file = path.join(consumerDir(projectRoot, consumerId), "acks.json");
  if (!fs.existsSync(file)) return { protocol: ENGINE_ACK_PROTOCOL, schemaVersion: ENGINE_SCHEMA_VERSION, consumerId, acknowledgedDeliveryIds: [], updatedAt: null };
  const ledger = readJson(file);
  if (ledger.consumerId !== consumerId) throw new Error(`ACK ledger consumer mismatch for '${consumerId}'.`);
  return { ...ledger, acknowledgedDeliveryIds: [...new Set(ledger.acknowledgedDeliveryIds ?? [])].sort() };
}

export function acknowledgeConsequences(projectRoot, consumerId, deliveryIds) {
  if (!Array.isArray(deliveryIds) || deliveryIds.length === 0) throw new Error("deliveryIds must be a non-empty array.");
  const known = new Set(listConsequenceDeliveries(projectRoot).map((item) => item.deliveryId));
  const unknown = [...new Set(deliveryIds)].filter((id) => !known.has(id));
  if (unknown.length) throw new Error(`Unknown delivery id(s): ${unknown.join(", ")}`);
  const ledger = loadAckLedger(projectRoot, consumerId);
  const before = new Set(ledger.acknowledgedDeliveryIds);
  const newlyAcked = [];
  const alreadyAcked = [];
  for (const id of [...new Set(deliveryIds)]) {
    if (before.has(id)) alreadyAcked.push(id);
    else { before.add(id); newlyAcked.push(id); }
  }
  const next = {
    protocol: ENGINE_ACK_PROTOCOL,
    schemaVersion: ENGINE_SCHEMA_VERSION,
    consumerId,
    acknowledgedDeliveryIds: [...before].sort(),
    updatedAt: new Date().toISOString(),
  };
  writeJsonAtomic(path.join(consumerDir(projectRoot, consumerId), "acks.json"), next);
  return { ledger: next, newlyAcked: newlyAcked.sort(), alreadyAcked: alreadyAcked.sort() };
}

function cursorFor(events, state) {
  const last = events.at(-1) ?? null;
  return { revision: state.revision, lastEventId: last?.id ?? null };
}

export function buildEngineExport(projectRoot, options = {}) {
  const consumerId = options.consumerId ?? "unity";
  assertSafeId(consumerId, "Consumer id");
  const manifest = loadManifest(projectRoot);
  const state = loadNarrativeState(projectRoot);
  const events = listNarrativeEvents(projectRoot);
  const ledger = loadAckLedger(projectRoot, consumerId);
  const acked = new Set(ledger.acknowledgedDeliveryIds);
  // ACK state is authoritative for delivery. Never hide an unacknowledged
  // consequence behind a narrative revision cursor: doing so would violate
  // at-least-once delivery if a consumer advanced its cursor before ACK.
  const consequences = listConsequenceDeliveries(projectRoot).filter((item) => !acked.has(item.deliveryId));
  const localization = options.includeLocalization === false ? [] : buildLocalizationCatalog(projectRoot);
  const deterministic = {
    protocol: ENGINE_EXPORT_PROTOCOL,
    schemaVersion: ENGINE_SCHEMA_VERSION,
    projectId: manifest.id ?? manifest.name ?? "unknown",
    consumerId,
    cursor: cursorFor(events, state),
    state: stateToEngineDto(state),
    consequences,
    localization,
  };
  return { ...deterministic, snapshotId: sha256(deterministic), generatedAt: new Date().toISOString(), deliverySemantics: "at-least-once; consumer MUST deduplicate by deliveryId before applying side effects" };
}

export function writeEngineExport(projectRoot, options = {}) {
  const document = buildEngineExport(projectRoot, options);
  const dir = narrativePath(projectRoot, "exports", document.consumerId);
  const file = path.join(dir, `rev-${String(document.cursor.revision).padStart(6, "0")}-${document.snapshotId.slice(0, 12)}.json`);
  writeJsonAtomic(file, document);
  writeJsonAtomic(path.join(dir, "latest.json"), document);
  return { file, document };
}

export function buildSaveGameSnapshot(projectRoot, options = {}) {
  const consumerId = options.consumerId ?? "unity";
  const slotId = options.slotId ?? "autosave";
  assertSafeId(consumerId, "Consumer id");
  assertSafeId(slotId, "Save slot id");
  const exportDoc = buildEngineExport(projectRoot, { consumerId, includeLocalization: false });
  const ledger = loadAckLedger(projectRoot, consumerId);
  const deterministic = {
    protocol: ENGINE_SAVE_PROTOCOL,
    schemaVersion: ENGINE_SCHEMA_VERSION,
    projectId: exportDoc.projectId,
    consumerId,
    slotId,
    cursor: exportDoc.cursor,
    state: exportDoc.state,
    acknowledgedDeliveryIds: ledger.acknowledgedDeliveryIds,
  };
  return { ...deterministic, snapshotId: sha256(deterministic), createdAt: new Date().toISOString(), metadata: options.metadata ?? {} };
}

export function writeSaveGameSnapshot(projectRoot, options = {}) {
  const snapshot = buildSaveGameSnapshot(projectRoot, options);
  const file = narrativePath(projectRoot, "exports", "savegames", snapshot.consumerId, `${snapshot.slotId}.json`);
  writeJsonAtomic(file, snapshot);
  return { file, snapshot };
}

function eventsThroughRevision(projectRoot, revision) {
  return listNarrativeEvents(projectRoot).filter((event) => event.revisionAfter <= revision);
}

function stateAtRevision(projectRoot, revision) {
  let state = loadInitialState(projectRoot);
  let expected = state.revision;
  if (revision < expected) throw new Error(`Revision ${revision} predates initial state revision ${expected}.`);
  for (const event of eventsThroughRevision(projectRoot, revision)) {
    if (event.revisionBefore !== expected || event.revisionAfter !== expected + 1) throw new Error(`Event '${event.id}' breaks revision chain at ${expected}.`);
    for (const delta of event.deltas ?? []) state = applyStateDelta(state, delta);
    expected = event.revisionAfter;
    state.revision = expected;
  }
  if (expected !== revision) throw new Error(`Cannot reconstruct checkpoint revision ${revision}; event log ends at ${expected}.`);
  return state;
}

export function createCheckpoint(projectRoot, options = {}) {
  const state = loadNarrativeState(projectRoot);
  const label = options.label ?? `r${state.revision}`;
  assertSafeId(label, "Checkpoint label");
  const events = eventsThroughRevision(projectRoot, state.revision);
  const checkpoint = {
    protocol: CHECKPOINT_PROTOCOL,
    schemaVersion: ENGINE_SCHEMA_VERSION,
    label,
    revision: state.revision,
    stateHash: sha256(stateToEngineDto(state)),
    eventHash: sha256(events),
    eventIds: events.map((event) => event.id),
    createdAt: new Date().toISOString(),
  };
  const file = narrativePath(projectRoot, "checkpoints", `${String(state.revision).padStart(6, "0")}-${label}.json`);
  writeJsonAtomic(file, checkpoint);
  return { file, checkpoint };
}

export function validateCheckpoint(projectRoot, checkpointOrFile) {
  const checkpoint = typeof checkpointOrFile === "string" ? readJson(checkpointOrFile) : checkpointOrFile;
  if (!checkpoint || !Number.isInteger(checkpoint.revision) || checkpoint.revision < 0) return { valid: false, errors: ["Checkpoint revision is invalid."] };
  const events = eventsThroughRevision(projectRoot, checkpoint.revision);
  const errors = [];
  if (sha256(events) !== checkpoint.eventHash) errors.push("Checkpoint event hash does not match current event-log prefix.");
  if (stableStringify(events.map((event) => event.id)) !== stableStringify(checkpoint.eventIds ?? [])) errors.push("Checkpoint event id sequence does not match current event-log prefix.");
  try {
    const state = stateAtRevision(projectRoot, checkpoint.revision);
    if (sha256(stateToEngineDto(state)) !== checkpoint.stateHash) errors.push("Checkpoint state hash does not match replayed state at checkpoint revision.");
  } catch (error) {
    errors.push(`Checkpoint state replay failed: ${error.message}`);
  }
  return { valid: errors.length === 0, errors, revision: checkpoint.revision };
}

export function inspectProjectSchema(projectRoot) {
  const manifest = loadManifest(projectRoot);
  const version = Number.isInteger(manifest.schemaVersion) ? manifest.schemaVersion : 0;
  return { version, currentVersion: PROJECT_SCHEMA_VERSION, needsMigration: version < PROJECT_SCHEMA_VERSION, supported: version <= PROJECT_SCHEMA_VERSION, manifest };
}

export function migrateProjectSchema(projectRoot, options = {}) {
  const inspected = inspectProjectSchema(projectRoot);
  if (!inspected.supported) throw new Error(`Project schema v${inspected.version} is newer than supported v${PROJECT_SCHEMA_VERSION}.`);
  let manifest = structuredClone(inspected.manifest);
  const applied = [];
  let version = inspected.version;
  if (version === 0) {
    const legacySchemaVersion = typeof manifest.schemaVersion === "string" ? manifest.schemaVersion : undefined;
    manifest = {
      ...manifest,
      ...(legacySchemaVersion ? { legacySchemaVersion } : {}),
      protocol: PROJECT_PROTOCOL,
      schemaVersion: 1,
    };
    applied.push("0->1: add integer project schemaVersion/protocol" + (legacySchemaVersion ? ` and preserve legacy schema label '${legacySchemaVersion}'` : ""));
    version = 1;
  }
  if (options.write && applied.length) writeJsonAtomic(narrativePath(projectRoot, "project.json"), manifest);
  return { fromVersion: inspected.version, toVersion: version, applied, manifest, written: Boolean(options.write && applied.length) };
}

export function validateProjectForEngine(projectRoot, options = {}) {
  const errors = [];
  const warnings = [];
  let schema;
  try {
    schema = inspectProjectSchema(projectRoot);
    if (!schema.supported) errors.push(`Project schema v${schema.version} is newer than supported v${PROJECT_SCHEMA_VERSION}.`);
    if (schema.needsMigration) warnings.push(`Project schema v${schema.version} should be migrated to v${PROJECT_SCHEMA_VERSION}.`);
  } catch (error) {
    errors.push(`Project manifest: ${error.message}`);
  }
  let state = null;
  try { state = loadNarrativeState(projectRoot); } catch (error) { errors.push(`State replay: ${error.message}`); }
  let deliveries = [];
  try { deliveries = listConsequenceDeliveries(projectRoot); } catch (error) { errors.push(`Gameplay consequences: ${error.message}`); }
  try { buildLocalizationCatalog(projectRoot); } catch (error) { errors.push(`Localization catalog: ${error.message}`); }
  if (state) {
    try { JSON.stringify(buildEngineExport(projectRoot, { consumerId: options.consumerId ?? "ci", includeLocalization: true })); }
    catch (error) { errors.push(`Engine export: ${error.message}`); }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      revision: state?.revision ?? null,
      events: (() => { try { return listNarrativeEvents(projectRoot).length; } catch { return null; } })(),
      consequenceDeliveries: deliveries.length,
      projectSchemaVersion: schema?.version ?? null,
    },
  };
}
