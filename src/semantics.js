import fs from "node:fs";
import path from "node:path";
import {
  assertSafeId,
  loadScene,
  narrativePath,
  readJson,
} from "./core.js";
import {
  commitNarrativeEvent,
  listNarrativeEvents,
  loadNarrativeState,
  validateStateDelta,
} from "./state-engine.js";

export const CONDITION_PROTOCOL = "pi-narrative.condition/v0.4";
export const CHOICE_PROTOCOL = "pi-narrative.choice/v0.4";
export const QUEST_PROTOCOL = "pi-narrative.quest/v0.4";
export const BRANCH_PROTOCOL = "pi-narrative.branch/v0.4";
export const TIMELINE_PROTOCOL = "pi-narrative.timeline/v0.4";

const jsonFiles = (dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort()
  : [];

function loadDirectory(projectRoot, name) {
  const dir = narrativePath(projectRoot, name);
  return jsonFiles(dir).map((file) => readJson(path.join(dir, file)));
}

function loadById(projectRoot, directory, id, label) {
  assertSafeId(id, `${label} id`);
  const filePath = narrativePath(projectRoot, directory, `${id}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`${label} '${id}' does not exist.`);
  const value = readJson(filePath);
  if (value.id !== id) throw new Error(`${label} '${id}' id does not match its filename.`);
  return value;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function ownPathValue(root, pathText) {
  if (typeof pathText !== "string" || !pathText.trim()) return { exists: false, value: undefined };
  const parts = pathText.split(".");
  if (parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return { exists: false, value: undefined };
  let current = root;
  for (const part of parts) {
    if (!isObject(current) || !Object.prototype.hasOwnProperty.call(current, part)) {
      return { exists: false, value: undefined };
    }
    current = current[part];
  }
  return { exists: true, value: current };
}

function compare(actual, comparator, expected, exists) {
  switch (comparator) {
    case "exists": return exists;
    case "not-exists": return !exists;
    case "eq": return exists && Object.is(actual, expected);
    case "neq": return !exists || !Object.is(actual, expected);
    case "gt": return exists && typeof actual === "number" && typeof expected === "number" && actual > expected;
    case "gte": return exists && typeof actual === "number" && typeof expected === "number" && actual >= expected;
    case "lt": return exists && typeof actual === "number" && typeof expected === "number" && actual < expected;
    case "lte": return exists && typeof actual === "number" && typeof expected === "number" && actual <= expected;
    case "contains": return exists && Array.isArray(actual) && actual.includes(expected);
    default: throw new Error(`Unsupported comparator '${comparator}'.`);
  }
}

function eventMatches(event, selector = {}) {
  if (selector.eventId && event.id !== selector.eventId) return false;
  const sourceType = event.source?.type ?? (event.simulationId ? "actor-turn" : "system");
  if (selector.sourceType && sourceType !== selector.sourceType) return false;
  if (selector.choiceId && event.source?.choiceId !== selector.choiceId) return false;
  if (selector.optionId && event.source?.optionId !== selector.optionId) return false;
  if (selector.simulationId && (event.source?.simulationId ?? event.simulationId) !== selector.simulationId) return false;
  if (selector.characterId && (event.source?.characterId ?? event.characterId) !== selector.characterId) return false;
  return true;
}

const EVENT_SELECTOR_KEYS = ["eventId", "sourceType", "choiceId", "optionId", "simulationId", "characterId"];

function validateEventSelector(selector, pathLabel) {
  const errors = [];
  if (!isObject(selector)) return [`${pathLabel} must be an object.`];
  const recognized = EVENT_SELECTOR_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(selector, key));
  if (recognized.length === 0) errors.push(`${pathLabel} must contain at least one supported selector field.`);
  for (const key of Object.keys(selector)) {
    if (!EVENT_SELECTOR_KEYS.includes(key)) errors.push(`${pathLabel}.${key} is unsupported.`);
  }
  for (const key of recognized) {
    if (typeof selector[key] !== "string" || !selector[key].trim()) errors.push(`${pathLabel}.${key} must be a non-empty string.`);
  }
  if (selector.sourceType && !["actor-turn", "choice", "system"].includes(selector.sourceType)) {
    errors.push(`${pathLabel}.sourceType must be actor-turn, choice, or system.`);
  }
  return errors;
}

export function validateCondition(condition, pathLabel = "condition") {
  const errors = [];
  if (!isObject(condition)) return { valid: false, errors: [`${pathLabel} must be an object.`] };
  switch (condition.op) {
    case "const":
      if (typeof condition.value !== "boolean") errors.push(`${pathLabel}.value must be boolean.`);
      break;
    case "all":
    case "any":
      if (!Array.isArray(condition.conditions) || condition.conditions.length === 0) {
        errors.push(`${pathLabel}.conditions must be a non-empty array.`);
      } else {
        condition.conditions.forEach((child, index) => {
          errors.push(...validateCondition(child, `${pathLabel}.conditions[${index}]`).errors);
        });
      }
      break;
    case "not":
      errors.push(...validateCondition(condition.condition, `${pathLabel}.condition`).errors);
      break;
    case "compare":
      if (typeof condition.path !== "string" || !condition.path.trim()) errors.push(`${pathLabel}.path is required.`);
      else if (condition.path.split(".").some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) errors.push(`${pathLabel}.path contains an unsafe segment.`);
      if (!["exists", "not-exists", "eq", "neq", "gt", "gte", "lt", "lte", "contains"].includes(condition.comparator)) {
        errors.push(`${pathLabel}.comparator is unsupported.`);
      }
      if (!["exists", "not-exists"].includes(condition.comparator) && !("value" in condition)) {
        errors.push(`${pathLabel}.value is required for comparator '${condition.comparator}'.`);
      }
      break;
    case "event":
      errors.push(...validateEventSelector(condition.selector, `${pathLabel}.selector`));
      break;
    default:
      errors.push(`${pathLabel}.op '${condition.op}' is unsupported.`);
  }
  return { valid: errors.length === 0, errors };
}

export function evaluateCondition(projectRoot, condition, options = {}) {
  const check = validateCondition(condition);
  if (!check.valid) throw new Error(`Invalid narrative condition: ${check.errors.join("; ")}`);
  const state = options.state ?? loadNarrativeState(projectRoot);
  const events = options.events ?? listNarrativeEvents(projectRoot);

  const walk = (node) => {
    if (node.op === "const") return { value: node.value, op: node.op };
    if (node.op === "all" || node.op === "any") {
      const children = node.conditions.map(walk);
      const value = node.op === "all" ? children.every((child) => child.value) : children.some((child) => child.value);
      return { value, op: node.op, children };
    }
    if (node.op === "not") {
      const child = walk(node.condition);
      return { value: !child.value, op: node.op, child };
    }
    if (node.op === "compare") {
      const resolved = ownPathValue(state, node.path);
      return {
        value: compare(resolved.value, node.comparator, node.value, resolved.exists),
        op: node.op,
        path: node.path,
        comparator: node.comparator,
        expected: node.value,
        exists: resolved.exists,
        actual: resolved.value,
      };
    }
    if (node.op === "event") {
      const matches = events.filter((event) => eventMatches(event, node.selector));
      return { value: matches.length > 0, op: node.op, selector: node.selector, matchingEventIds: matches.map((event) => event.id) };
    }
    throw new Error(`Unsupported condition op '${node.op}'.`);
  };

  const trace = walk(condition);
  return { value: trace.value, trace, stateRevision: state.revision };
}

export function loadChoice(projectRoot, choiceId) {
  const choice = loadById(projectRoot, "choices", choiceId, "Choice");
  const check = validateChoice(projectRoot, choice);
  if (!check.valid) throw new Error(`Invalid Choice '${choiceId}': ${check.errors.join("; ")}`);
  return choice;
}

export function listChoices(projectRoot) {
  return loadDirectory(projectRoot, "choices");
}

function validateAuthoredDeltaShape(delta, pathLabel) {
  const errors = [];
  if (!isObject(delta)) return [`${pathLabel} must be an object.`];
  const finiteNumber = (value, name) => {
    if (typeof value !== "number" || !Number.isFinite(value)) errors.push(`${pathLabel}.${name} must be a finite number.`);
  };
  if (delta.type === "resource") {
    if (typeof delta.characterId !== "string" || !delta.characterId) errors.push(`${pathLabel}.characterId is required.`);
    if (typeof delta.resourceId !== "string" || !delta.resourceId) errors.push(`${pathLabel}.resourceId is required.`);
    if (!["increment", "set"].includes(delta.op)) errors.push(`${pathLabel}.op must be increment or set.`);
    finiteNumber(delta.value, "value");
  } else if (delta.type === "relationship") {
    if (typeof delta.fromCharacterId !== "string" || !delta.fromCharacterId) errors.push(`${pathLabel}.fromCharacterId is required.`);
    if (typeof delta.toCharacterId !== "string" || !delta.toCharacterId) errors.push(`${pathLabel}.toCharacterId is required.`);
    if (typeof delta.metric !== "string" || !delta.metric) errors.push(`${pathLabel}.metric is required.`);
    if (!["increment", "set"].includes(delta.op)) errors.push(`${pathLabel}.op must be increment or set.`);
    finiteNumber(delta.value, "value");
  } else if (delta.type === "knowledge") {
    if (typeof delta.characterId !== "string" || !delta.characterId) errors.push(`${pathLabel}.characterId is required.`);
    if (typeof delta.factId !== "string" || !delta.factId) errors.push(`${pathLabel}.factId is required.`);
    if (delta.op !== "add") errors.push(`${pathLabel}.op must be add.`);
  } else if (delta.type === "state") {
    if (!["character", "world"].includes(delta.scope)) errors.push(`${pathLabel}.scope must be character or world.`);
    if (delta.scope === "character" && (typeof delta.characterId !== "string" || !delta.characterId)) errors.push(`${pathLabel}.characterId is required for character scope.`);
    if (typeof delta.key !== "string" || !delta.key) errors.push(`${pathLabel}.key is required.`);
    if (!["increment", "set"].includes(delta.op)) errors.push(`${pathLabel}.op must be increment or set.`);
    if (delta.op === "increment") finiteNumber(delta.value, "value");
    if (delta.op === "set" && !["number", "string", "boolean"].includes(typeof delta.value)) errors.push(`${pathLabel}.value must be number, string, or boolean for set.`);
  } else {
    errors.push(`${pathLabel}.type '${delta.type}' is unsupported.`);
  }
  return errors;
}

export function validateChoice(projectRoot, choice) {
  const errors = [];
  if (!choice?.id || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(choice.id)) errors.push("Choice id is required and must be path-safe.");
  if (!choice?.prompt) errors.push("Choice prompt is required.");
  if (choice.singleUse != null && typeof choice.singleUse !== "boolean") errors.push("Choice singleUse must be boolean when provided.");
  if (choice.sceneId) {
    try { loadScene(projectRoot, choice.sceneId); } catch { errors.push(`Choice references unknown scene '${choice.sceneId}'.`); }
  }
  if (choice.availableWhen) errors.push(...validateCondition(choice.availableWhen, "choice.availableWhen").errors);
  if (!Array.isArray(choice.options) || choice.options.length < 2) errors.push("Choice must contain at least two options.");
  const optionIds = new Set();
  for (const [index, option] of (choice.options ?? []).entries()) {
    const prefix = `choice.options[${index}]`;
    if (!option.id || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(option.id)) errors.push(`${prefix}.id is invalid.`);
    if (optionIds.has(option.id)) errors.push(`${prefix}.id '${option.id}' is duplicated.`);
    optionIds.add(option.id);
    if (!option.label) errors.push(`${prefix}.label is required.`);
    if (!option.outcomeText) errors.push(`${prefix}.outcomeText is required.`);
    if (option.availableWhen) errors.push(...validateCondition(option.availableWhen, `${prefix}.availableWhen`).errors);
    for (const [deltaIndex, delta] of (option.deltas ?? []).entries()) {
      errors.push(...validateAuthoredDeltaShape(delta, `${prefix}.deltas[${deltaIndex}]`));
    }
    for (const [consequenceIndex, consequence] of (option.gameplayConsequences ?? []).entries()) {
      if (!isObject(consequence) || typeof consequence.type !== "string" || typeof consequence.id !== "string") {
        errors.push(`${prefix}.gameplayConsequences[${consequenceIndex}] requires string type and id.`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

function choiceAlreadySelected(events, choiceId) {
  return events.some((event) => event.source?.type === "choice" && event.source.choiceId === choiceId);
}

export function evaluateChoice(projectRoot, choiceOrId, options = {}) {
  const choice = typeof choiceOrId === "string" ? loadChoice(projectRoot, choiceOrId) : choiceOrId;
  if (typeof choiceOrId !== "string") {
    const check = validateChoice(projectRoot, choice);
    if (!check.valid) throw new Error(`Invalid Choice '${choice?.id ?? "unknown"}': ${check.errors.join("; ")}`);
  }
  const state = options.state ?? loadNarrativeState(projectRoot);
  const events = options.events ?? listNarrativeEvents(projectRoot);
  const alreadySelected = choiceAlreadySelected(events, choice.id);
  const choiceAvailable = (choice.singleUse ?? true) && alreadySelected
    ? false
    : (choice.availableWhen ? evaluateCondition(projectRoot, choice.availableWhen, { state, events }).value : true);
  return {
    id: choice.id,
    sceneId: choice.sceneId ?? null,
    prompt: choice.prompt,
    singleUse: choice.singleUse ?? true,
    selected: alreadySelected,
    available: choiceAvailable,
    options: (choice.options ?? []).map((option) => ({
      id: option.id,
      label: option.label,
      available: choiceAvailable && (option.availableWhen
        ? evaluateCondition(projectRoot, option.availableWhen, { state, events }).value
        : true),
      gameplayConsequences: option.gameplayConsequences ?? [],
    })),
  };
}

export function availableChoices(projectRoot, { sceneId } = {}) {
  const state = loadNarrativeState(projectRoot);
  const events = listNarrativeEvents(projectRoot);
  return listChoices(projectRoot)
    .filter((choice) => !sceneId || choice.sceneId === sceneId)
    .map((choice) => evaluateChoice(projectRoot, choice, { state, events }))
    .filter((choice) => choice.available);
}

export function applyChoice(projectRoot, choiceId, optionId, options = {}) {
  const choice = loadChoice(projectRoot, choiceId);
  const state = loadNarrativeState(projectRoot);
  const events = listNarrativeEvents(projectRoot);
  const evaluated = evaluateChoice(projectRoot, choice, { state, events });
  if (!evaluated.available) throw new Error(`Choice '${choiceId}' is not currently available.`);
  const optionState = evaluated.options.find((item) => item.id === optionId);
  const option = choice.options.find((item) => item.id === optionId);
  if (!option || !optionState) throw new Error(`Choice '${choiceId}' has no option '${optionId}'.`);
  if (!optionState.available) throw new Error(`Choice option '${choiceId}/${optionId}' is not currently available.`);

  const eventId = options.eventId ?? `choice-${choiceId}-${optionId}-r${state.revision + 1}`;
  const committed = commitNarrativeEvent(projectRoot, {
    id: eventId,
    baseRevision: options.expectedRevision ?? state.revision,
    source: { type: "choice", choiceId, optionId, ...(choice.sceneId ? { sceneId: choice.sceneId } : {}) },
    decision: {
      outcome: "accepted",
      observableResult: option.outcomeText,
      deltas: option.deltas ?? [],
    },
    gameplayConsequences: option.gameplayConsequences ?? [],
  });
  return {
    choiceId,
    optionId,
    event: committed.event,
    state: committed.state,
    branches: choice.sceneId ? resolveBranches(projectRoot, choice.sceneId, { state: committed.state }) : [],
    quests: evaluateQuests(projectRoot, { state: committed.state }),
  };
}

export function loadQuest(projectRoot, questId) {
  return loadById(projectRoot, "quests", questId, "Quest");
}

export function listQuests(projectRoot) {
  return loadDirectory(projectRoot, "quests");
}

export function validateQuest(quest) {
  const errors = [];
  if (!quest?.id || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(quest.id)) errors.push("Quest id is required and must be path-safe.");
  if (!quest?.title) errors.push("Quest title is required.");
  if (quest.availableWhen) errors.push(...validateCondition(quest.availableWhen, "quest.availableWhen").errors);
  if (quest.failWhen) errors.push(...validateCondition(quest.failWhen, "quest.failWhen").errors);
  if (quest.completeWhen) errors.push(...validateCondition(quest.completeWhen, "quest.completeWhen").errors);
  if (!Array.isArray(quest.objectives) || quest.objectives.length === 0) errors.push("Quest objectives must be a non-empty array.");
  const ids = new Set();
  for (const [index, objective] of (quest.objectives ?? []).entries()) {
    const prefix = `quest.objectives[${index}]`;
    if (!objective.id || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(objective.id)) errors.push(`${prefix}.id is required and must be path-safe.`);
    if (ids.has(objective.id)) errors.push(`${prefix}.id '${objective.id}' is duplicated.`);
    ids.add(objective.id);
    if (!objective.title) errors.push(`${prefix}.title is required.`);
    if (!objective.completeWhen) errors.push(`${prefix}.completeWhen is required.`);
    else errors.push(...validateCondition(objective.completeWhen, `${prefix}.completeWhen`).errors);
    if (objective.availableWhen) errors.push(...validateCondition(objective.availableWhen, `${prefix}.availableWhen`).errors);
    if (objective.failWhen) errors.push(...validateCondition(objective.failWhen, `${prefix}.failWhen`).errors);
  }
  const positions = new Map((quest.objectives ?? []).map((objective, index) => [objective.id, index]));
  for (const objective of (quest.objectives ?? [])) {
    for (const dependency of objective.dependsOn ?? []) {
      if (!ids.has(dependency)) errors.push(`Objective '${objective.id}' depends on unknown objective '${dependency}'.`);
      if (dependency === objective.id) errors.push(`Objective '${objective.id}' cannot depend on itself.`);
      if (positions.has(dependency) && positions.get(dependency) >= positions.get(objective.id)) {
        errors.push(`Objective '${objective.id}' must depend only on an earlier objective in v0.4.`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function evaluateQuest(projectRoot, questOrId, options = {}) {
  const quest = typeof questOrId === "string" ? loadQuest(projectRoot, questOrId) : questOrId;
  const check = validateQuest(quest);
  if (!check.valid) throw new Error(`Invalid Quest '${quest.id ?? "unknown"}': ${check.errors.join("; ")}`);
  const state = options.state ?? loadNarrativeState(projectRoot);
  const events = options.events ?? listNarrativeEvents(projectRoot);
  const condition = (node) => node ? evaluateCondition(projectRoot, node, { state, events }).value : false;
  const questAvailable = quest.availableWhen ? condition(quest.availableWhen) : true;
  const objectiveStates = new Map();
  const objectives = (quest.objectives ?? []).map((objective) => {
    const dependenciesComplete = (objective.dependsOn ?? []).every((id) => objectiveStates.get(id) === "completed");
    const objectiveAvailable = !objective.availableWhen || condition(objective.availableWhen);
    let status;
    if (!questAvailable || !dependenciesComplete || !objectiveAvailable) status = "locked";
    else if (objective.failWhen && condition(objective.failWhen)) status = "failed";
    else if (condition(objective.completeWhen)) status = "completed";
    else status = "active";
    objectiveStates.set(objective.id, status);
    return { id: objective.id, title: objective.title, status, dependsOn: objective.dependsOn ?? [] };
  });

  const anyFailed = objectives.some((objective) => objective.status === "failed");
  const allCompleted = objectives.every((objective) => objective.status === "completed");
  let status;
  if ((quest.failWhen && condition(quest.failWhen)) || anyFailed) status = "failed";
  else if ((quest.completeWhen && condition(quest.completeWhen)) || (!quest.completeWhen && allCompleted)) status = "completed";
  else if (!questAvailable) status = "locked";
  else status = "active";
  return { id: quest.id, title: quest.title, status, objectives, stateRevision: state.revision };
}

export function evaluateQuests(projectRoot, options = {}) {
  const state = options.state ?? loadNarrativeState(projectRoot);
  const events = options.events ?? listNarrativeEvents(projectRoot);
  return listQuests(projectRoot).map((quest) => evaluateQuest(projectRoot, quest, { state, events }));
}

export function validateBranch(projectRoot, branch) {
  const errors = [];
  if (!branch?.id || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(branch.id)) errors.push("Branch id is required and must be path-safe.");
  for (const key of ["fromSceneId", "targetSceneId"]) {
    if (!branch?.[key]) errors.push(`Branch ${key} is required.`);
    else {
      try { loadScene(projectRoot, branch[key]); } catch { errors.push(`Branch references unknown ${key} '${branch[key]}'.`); }
    }
  }
  if (branch.when) errors.push(...validateCondition(branch.when, "branch.when").errors);
  if (branch.priority != null && (!Number.isInteger(branch.priority) || !Number.isFinite(branch.priority))) errors.push("Branch priority must be an integer.");
  return { valid: errors.length === 0, errors };
}

export function loadBranches(projectRoot) {
  return loadDirectory(projectRoot, "branches");
}

export function resolveBranches(projectRoot, fromSceneId, options = {}) {
  assertSafeId(fromSceneId, "Scene id");
  const state = options.state ?? loadNarrativeState(projectRoot);
  const events = options.events ?? listNarrativeEvents(projectRoot);
  return loadBranches(projectRoot)
    .filter((branch) => branch.fromSceneId === fromSceneId)
    .map((branch) => {
      const check = validateBranch(projectRoot, branch);
      if (!check.valid) throw new Error(`Invalid Branch '${branch?.id ?? "unknown"}': ${check.errors.join("; ")}`);
      const available = branch.when ? evaluateCondition(projectRoot, branch.when, { state, events }).value : true;
      const targetEntry = evaluateSceneGate(projectRoot, branch.targetSceneId, { state, events }).entry;
      return {
        id: branch.id,
        fromSceneId: branch.fromSceneId,
        targetSceneId: branch.targetSceneId,
        priority: branch.priority ?? 0,
        available: available && targetEntry,
      };
    })
    .filter((branch) => branch.available)
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}

export function evaluateSceneGate(projectRoot, sceneId, options = {}) {
  const scene = loadScene(projectRoot, sceneId);
  const state = options.state ?? loadNarrativeState(projectRoot);
  const events = options.events ?? listNarrativeEvents(projectRoot);
  const entry = scene.entryCondition ? evaluateCondition(projectRoot, scene.entryCondition, { state, events }) : { value: true, trace: { value: true, op: "const" } };
  const exit = scene.exitCondition ? evaluateCondition(projectRoot, scene.exitCondition, { state, events }) : { value: false, trace: { value: false, op: "const" } };
  return {
    sceneId,
    entry: entry.value,
    exit: exit.value,
    entryTrace: entry.trace,
    exitTrace: exit.trace,
    stateRevision: state.revision,
  };
}

export function loadTimeline(projectRoot) {
  const file = narrativePath(projectRoot, "timeline.json");
  if (!fs.existsSync(file)) return { protocol: TIMELINE_PROTOCOL, constraints: [] };
  return readJson(file);
}

function firstMatchingEventIndex(events, selector) {
  const index = events.findIndex((event) => eventMatches(event, selector));
  return index === -1 ? null : index;
}

export function validateTimeline(timeline) {
  const errors = [];
  if (!isObject(timeline)) return { valid: false, errors: ["Timeline must be an object."] };
  if (!Array.isArray(timeline.constraints)) errors.push("Timeline constraints must be an array.");
  const ids = new Set();
  for (const [index, constraint] of (timeline.constraints ?? []).entries()) {
    const prefix = `timeline.constraints[${index}]`;
    if (!constraint.id || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(constraint.id)) errors.push(`${prefix}.id is required and must be path-safe.`);
    if (ids.has(constraint.id)) errors.push(`${prefix}.id '${constraint.id}' is duplicated.`);
    ids.add(constraint.id);
    if (constraint.type === "event-before") {
      errors.push(...validateEventSelector(constraint.first, `${prefix}.first`));
      errors.push(...validateEventSelector(constraint.second, `${prefix}.second`));
    } else if (constraint.type === "condition-requires") {
      errors.push(...validateCondition(constraint.when, `${prefix}.when`).errors);
      errors.push(...validateCondition(constraint.mustHave, `${prefix}.mustHave`).errors);
    } else {
      errors.push(`${prefix}.type '${constraint.type}' is unsupported.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function evaluateTimeline(projectRoot, options = {}) {
  const state = options.state ?? loadNarrativeState(projectRoot);
  const events = options.events ?? listNarrativeEvents(projectRoot);
  const timeline = loadTimeline(projectRoot);
  const check = validateTimeline(timeline);
  if (!check.valid) throw new Error(`Invalid timeline: ${check.errors.join("; ")}`);
  const constraints = (timeline.constraints ?? []).map((constraint) => {
    if (constraint.type === "event-before") {
      const first = firstMatchingEventIndex(events, constraint.first);
      const second = firstMatchingEventIndex(events, constraint.second);
      let status = "pending";
      if (second !== null && (first === null || first >= second)) status = "violated";
      else if (first !== null && second !== null && first < second) status = "satisfied";
      return { id: constraint.id, type: constraint.type, status, firstIndex: first, secondIndex: second };
    }
    if (constraint.type === "condition-requires") {
      const when = evaluateCondition(projectRoot, constraint.when, { state, events }).value;
      const mustHave = evaluateCondition(projectRoot, constraint.mustHave, { state, events }).value;
      const status = !when ? "pending" : mustHave ? "satisfied" : "violated";
      return { id: constraint.id, type: constraint.type, status, when, mustHave };
    }
    return { id: constraint.id ?? "unknown", type: constraint.type ?? "unknown", status: "invalid" };
  });
  return {
    stateRevision: state.revision,
    constraints,
    valid: constraints.every((constraint) => constraint.status !== "violated" && constraint.status !== "invalid"),
  };
}

export function gameplayConsequences(projectRoot) {
  return listNarrativeEvents(projectRoot).flatMap((event) => (event.gameplayConsequences ?? []).map((consequence, index) => ({
    eventId: event.id,
    source: event.source ?? null,
    index,
    ...consequence,
  })));
}

export function narrativeFlowSnapshot(projectRoot, options = {}) {
  const state = loadNarrativeState(projectRoot);
  const events = listNarrativeEvents(projectRoot);
  const sceneId = options.sceneId;
  return {
    stateRevision: state.revision,
    ...(sceneId ? { sceneGate: evaluateSceneGate(projectRoot, sceneId, { state, events }) } : {}),
    choices: availableChoices(projectRoot, { ...(sceneId ? { sceneId } : {}) }),
    quests: evaluateQuests(projectRoot, { state, events }),
    ...(sceneId ? { branches: resolveBranches(projectRoot, sceneId, { state, events }) } : {}),
    timeline: evaluateTimeline(projectRoot, { state, events }),
    gameplayConsequences: gameplayConsequences(projectRoot),
  };
}
