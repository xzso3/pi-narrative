import fs from "node:fs";
import path from "node:path";

export const NARRATIVE_DIR = "narrative";


export function assertSafeId(id, label = "Id") {
  if (typeof id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) {
    throw new Error(`${label} may contain only letters, numbers, dot, underscore, and hyphen.`);
  }
  return id;
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

export function narrativePath(projectRoot, ...parts) {
  return path.join(projectRoot, NARRATIVE_DIR, ...parts);
}

export function loadManifest(projectRoot) {
  return readJson(narrativePath(projectRoot, "project.json"));
}

export function loadCharacter(projectRoot, characterId) {
  assertSafeId(characterId, "Character id");
  return readJson(narrativePath(projectRoot, "characters", `${characterId}.json`));
}

export function loadScene(projectRoot, sceneId, source = "scenes") {
  assertSafeId(sceneId, "Scene id");
  if (!['scenes', 'drafts', 'canon'].includes(source)) throw new Error(`Unsupported scene source '${source}'.`);
  return readJson(narrativePath(projectRoot, source, `${sceneId}.json`));
}

export function loadWorld(projectRoot) {
  return readJson(narrativePath(projectRoot, "world.json"));
}

function indexById(items = []) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

/**
 * Build the only context an Actor is allowed to see.
 * Canon-only future facts and other characters' private knowledge never enter this object.
 */
export function buildActorContext(projectRoot, characterId, sceneId) {
  const world = loadWorld(projectRoot);
  const character = loadCharacter(projectRoot, characterId);
  const scene = loadScene(projectRoot, sceneId);

  if (!scene.cast.includes(characterId)) {
    throw new Error(`Character '${characterId}' is not in scene '${sceneId}' cast.`);
  }

  const worldFacts = indexById(world.facts);
  const allowedFactIds = new Set([
    ...(character.knowledge?.factIds ?? []),
    ...(scene.publicFactIds ?? []),
  ]);

  const visibleFacts = [...allowedFactIds]
    .map((id) => worldFacts[id])
    .filter(Boolean)
    .filter((fact) => fact.actorVisible !== false);

  return {
    protocol: "pi-narrative.actor-context/v0.1",
    character: {
      id: character.id,
      name: character.name,
      identity: character.identity,
      desire: character.desire,
      fear: character.fear,
      boundaries: character.boundaries ?? [],
      speech: character.speech ?? {},
      currentState: character.currentState ?? {},
      relationships: character.relationships ?? {},
      privateFacts: character.knowledge?.privateFacts ?? [],
    },
    scene: {
      id: scene.id,
      title: scene.title,
      location: scene.location,
      situation: scene.situation,
      immediateGoal: scene.actorGoals?.[characterId] ?? null,
      publicEvents: scene.publicEvents ?? [],
    },
    knownWorldFacts: visibleFacts,
    hardRules: [
      "Do not use information absent from this context.",
      "Do not optimize for plot progression or author intent.",
      "Act only from this character's goals, beliefs, knowledge, emotions, and constraints.",
      "Treat future/canon-only information as nonexistent.",
    ],
  };
}

export function validateScene(projectRoot, sceneId, source = "scenes") {
  const errors = [];
  const warnings = [];
  let manifest;
  let scene;
  try {
    manifest = loadManifest(projectRoot);
    scene = loadScene(projectRoot, sceneId, source);
  } catch (error) {
    return { valid: false, errors: [error.message], warnings };
  }

  if (!scene.id || scene.id !== sceneId) errors.push("Scene id is missing or does not match filename.");
  if (!Array.isArray(scene.cast) || scene.cast.length === 0) errors.push("Scene cast must contain at least one character.");
  if (!scene.location) errors.push("Scene location is required.");
  if (!scene.situation) errors.push("Scene situation is required.");
  if (!scene.outcome || !Array.isArray(scene.outcome.stateChanges)) {
    warnings.push("Scene has no explicit outcome.stateChanges; canonization may not update state.");
  }

  for (const characterId of scene.cast ?? []) {
    try {
      loadCharacter(projectRoot, characterId);
    } catch {
      errors.push(`Cast character '${characterId}' does not exist.`);
    }
  }

  const knownSceneIds = new Set(manifest.sceneOrder ?? []);
  if (knownSceneIds.size && !knownSceneIds.has(sceneId)) {
    warnings.push(`Scene '${sceneId}' is not listed in project.sceneOrder.`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function recordSimulation(projectRoot, simulation) {
  if (!simulation?.sceneId || !simulation?.id || !Array.isArray(simulation.turns)) {
    throw new Error("Simulation requires id, sceneId, and turns[].");
  }
  assertSafeId(simulation.id, "Simulation id");
  const sceneValidation = validateScene(projectRoot, simulation.sceneId);
  if (!sceneValidation.valid) {
    throw new Error(`Cannot record simulation for invalid scene: ${sceneValidation.errors.join("; ")}`);
  }
  const output = {
    protocol: "pi-narrative.simulation/v0.1",
    createdAt: new Date().toISOString(),
    ...simulation,
  };
  writeJsonAtomic(narrativePath(projectRoot, "simulations", `${simulation.id}.json`), output);
  return output;
}

export function canonizeDraft(projectRoot, sceneId, { approvedBy = "human" } = {}) {
  const validation = validateScene(projectRoot, sceneId, "drafts");
  if (!validation.valid) {
    throw new Error(`Draft failed validation: ${validation.errors.join("; ")}`);
  }

  const draftPath = narrativePath(projectRoot, "drafts", `${sceneId}.json`);
  const canonPath = narrativePath(projectRoot, "canon", `${sceneId}.json`);
  if (fs.existsSync(canonPath)) {
    throw new Error(`Canon scene '${sceneId}' already exists; v0.1 never overwrites canon.`);
  }

  const draft = readJson(draftPath);
  const canon = {
    ...draft,
    canon: {
      status: "approved",
      approvedBy,
      approvedAt: new Date().toISOString(),
    },
  };
  writeJsonAtomic(canonPath, canon);
  return canon;
}

export function projectStatus(projectRoot) {
  const dirs = ["characters", "scenes", "choices", "branches", "quests", "simulations", "events", "drafts", "canon"];
  const counts = {};
  for (const dir of dirs) {
    const full = narrativePath(projectRoot, dir);
    counts[dir] = fs.existsSync(full) ? fs.readdirSync(full).filter((x) => x.endsWith(".json")).length : 0;
  }
  return {
    project: loadManifest(projectRoot),
    counts,
    timeline: fs.existsSync(narrativePath(projectRoot, "timeline.json")),
  };
}
