import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
  buildActorContext,
  canonizeDraft,
  projectStatus,
  recordSimulation,
  validateScene,
} from "../src/core.js";
import {
  createSimulation,
  loadSimulation,
  runNextResolvedTurn,
  simulationReplay,
} from "../src/runtime.js";
import { listNarrativeEvents, loadNarrativeState } from "../src/state-engine.js";
import {
  applyChoice,
  availableChoices,
  evaluateChoice,
  evaluateCondition,
  evaluateQuest,
  evaluateQuests,
  evaluateSceneGate,
  evaluateTimeline,
  gameplayConsequences,
  narrativeFlowSnapshot,
  resolveBranches,
} from "../src/semantics.js";
import { runActorWithPi } from "../src/pi-actor-runner.js";
import { runArbiterWithPi } from "../src/pi-arbiter-runner.js";

function root(input?: string) {
  return path.resolve(input || process.cwd());
}

function result(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    details: value,
  };
}

export default function narrativeRuntime(pi: ExtensionAPI) {
  pi.registerTool({
    name: "narrative_actor_context",
    label: "Narrative Actor Context",
    description: "Build a knowledge-isolated context for one character in one scene. Use this before roleplaying a character.",
    parameters: Type.Object({
      characterId: Type.String(),
      sceneId: Type.String(),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(buildActorContext(root(params.projectRoot), params.characterId, params.sceneId));
    },
  });

  pi.registerTool({
    name: "narrative_validate_scene",
    label: "Validate Narrative Scene",
    description: "Validate a scene or draft against the narrative project rules.",
    parameters: Type.Object({
      sceneId: Type.String(),
      source: Type.Optional(Type.Union([Type.Literal("scenes"), Type.Literal("drafts")])),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(validateScene(root(params.projectRoot), params.sceneId, params.source ?? "scenes"));
    },
  });

  pi.registerTool({
    name: "narrative_record_simulation",
    label: "Record Narrative Simulation",
    description: "Persist a manually supplied structured roleplay simulation transcript. This does not change canon.",
    parameters: Type.Object({
      id: Type.String(),
      sceneId: Type.String(),
      projectRoot: Type.Optional(Type.String()),
      turns: Type.Array(Type.Object({
        characterId: Type.String(),
        intent: Type.String(),
        action: Type.String(),
        dialogue: Type.Optional(Type.String()),
      })),
      notes: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(recordSimulation(root(params.projectRoot), params));
    },
  });

  pi.registerTool({
    name: "narrative_start_simulation",
    label: "Start Narrative Simulation",
    description: "Create a resumable v0.4 scene simulation after deterministic scene-entry gate evaluation.",
    parameters: Type.Object({
      sceneId: Type.String(),
      id: Type.Optional(Type.String()),
      maxTurns: Type.Optional(Type.Integer({ minimum: 1 })),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(createSimulation(root(params.projectRoot), params.sceneId, { id: params.id, maxTurns: params.maxTurns }));
    },
  });

  pi.registerTool({
    name: "narrative_simulate_next_turn",
    label: "Simulate Next Actor Turn",
    description: "Run one isolated Actor session, resolve its attempted action through an isolated Arbiter, apply validated state deltas, and persist the turn.",
    parameters: Type.Object({
      simulationId: Type.String(),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params, signal, _onUpdate, ctx) {
      const projectRoot = root(params.projectRoot);
      const value = await runNextResolvedTurn(
        projectRoot,
        params.simulationId,
        ({ context }) => runActorWithPi({ projectRoot, context, model: ctx.model, signal }),
        ({ context }) => runArbiterWithPi({ projectRoot, context, model: ctx.model, signal }),
      );
      return result(value);
    },
  });

  pi.registerTool({
    name: "narrative_simulation_state",
    label: "Narrative Simulation State",
    description: "Read a persisted simulation with both public replay and private Actor-turn records.",
    parameters: Type.Object({
      simulationId: Type.String(),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(simulationReplay(root(params.projectRoot), params.simulationId));
    },
  });

  pi.registerTool({
    name: "narrative_state",
    label: "Narrative Mutable State",
    description: "Read the replayed mutable narrative state. Event log is the source of truth; current.json is only a cache.",
    parameters: Type.Object({ projectRoot: Type.Optional(Type.String()) }),
    async execute(_id, params) {
      return result(loadNarrativeState(root(params.projectRoot)));
    },
  });

  pi.registerTool({
    name: "narrative_event_log",
    label: "Narrative Event Log",
    description: "Read deterministic world-state events produced by the Arbiter.",
    parameters: Type.Object({ projectRoot: Type.Optional(Type.String()) }),
    async execute(_id, params) {
      return result(listNarrativeEvents(root(params.projectRoot)));
    },
  });

  pi.registerTool({
    name: "narrative_evaluate_condition",
    label: "Evaluate Narrative Condition",
    description: "Evaluate a declarative v0.4 predicate against replayed narrative state and event history. No arbitrary code is executed.",
    parameters: Type.Object({
      condition: Type.Any(),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(evaluateCondition(root(params.projectRoot), params.condition));
    },
  });

  pi.registerTool({
    name: "narrative_scene_gate",
    label: "Narrative Scene Gate",
    description: "Evaluate deterministic entry/exit conditions for a scene.",
    parameters: Type.Object({
      sceneId: Type.String(),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(evaluateSceneGate(root(params.projectRoot), params.sceneId));
    },
  });

  pi.registerTool({
    name: "narrative_choices",
    label: "Narrative Choices",
    description: "List currently available authored player choices, optionally scoped to one scene.",
    parameters: Type.Object({
      sceneId: Type.Optional(Type.String()),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(availableChoices(root(params.projectRoot), { sceneId: params.sceneId }));
    },
  });

  pi.registerTool({
    name: "narrative_apply_choice",
    label: "Apply Narrative Choice",
    description: "Apply one explicitly selected authored choice option as a deterministic revisioned NarrativeEvent. Never choose autonomously. This mutates narrative state and requires the caller's expected revision.",
    parameters: Type.Object({
      choiceId: Type.String(),
      optionId: Type.String(),
      expectedRevision: Type.Integer({ minimum: 0 }),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(applyChoice(root(params.projectRoot), params.choiceId, params.optionId, { expectedRevision: params.expectedRevision }));
    },
  });

  pi.registerTool({
    name: "narrative_quests",
    label: "Narrative Quest State",
    description: "Derive quest and objective states from current predicates. Quest state is not stored separately.",
    parameters: Type.Object({
      questId: Type.Optional(Type.String()),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      const projectRoot = root(params.projectRoot);
      return result(params.questId ? evaluateQuest(projectRoot, params.questId) : evaluateQuests(projectRoot));
    },
  });

  pi.registerTool({
    name: "narrative_branches",
    label: "Narrative Branches",
    description: "Resolve currently available branch targets from a scene, including target scene-entry gates.",
    parameters: Type.Object({
      fromSceneId: Type.String(),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(resolveBranches(root(params.projectRoot), params.fromSceneId));
    },
  });

  pi.registerTool({
    name: "narrative_timeline",
    label: "Narrative Timeline Constraints",
    description: "Evaluate event-order and state-continuity constraints against current history.",
    parameters: Type.Object({ projectRoot: Type.Optional(Type.String()) }),
    async execute(_id, params) {
      return result(evaluateTimeline(root(params.projectRoot)));
    },
  });

  pi.registerTool({
    name: "narrative_gameplay_consequences",
    label: "Narrative Gameplay Consequences",
    description: "List engine-facing gameplay consequence descriptors emitted by semantic events.",
    parameters: Type.Object({ projectRoot: Type.Optional(Type.String()) }),
    async execute(_id, params) {
      return result(gameplayConsequences(root(params.projectRoot)));
    },
  });

  pi.registerTool({
    name: "narrative_flow",
    label: "Narrative Flow Snapshot",
    description: "Return a deterministic snapshot of scene gates, choices, quests, branches, timeline constraints, and gameplay consequences.",
    parameters: Type.Object({
      sceneId: Type.Optional(Type.String()),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(narrativeFlowSnapshot(root(params.projectRoot), { sceneId: params.sceneId }));
    },
  });

  pi.registerTool({
    name: "narrative_status",
    label: "Narrative Project Status",
    description: "Summarize the current narrative project and counts of source, simulation, draft, and canon assets.",
    parameters: Type.Object({ projectRoot: Type.Optional(Type.String()) }),
    async execute(_id, params) {
      return result(projectStatus(root(params.projectRoot)));
    },
  });

  pi.registerCommand("narrative-status", {
    description: "Show Pi Narrative project status",
    handler: async (_args, ctx) => {
      const status = projectStatus(process.cwd());
      ctx.ui.notify(`Pi Narrative: ${status.project.title} | ${JSON.stringify(status.counts)}`, "info");
    },
  });

  pi.registerCommand("simulate-scene", {
    description: "Run/resume an isolated-Actor simulation: /simulate-scene <scene-id> [max-turns]",
    handler: async (args, ctx) => {
      const [sceneId, maxTurnsText] = args.trim().split(/\s+/);
      if (!sceneId) {
        ctx.ui.notify("Usage: /simulate-scene <scene-id> [max-turns]", "error");
        return;
      }
      const maxTurns = maxTurnsText ? Number.parseInt(maxTurnsText, 10) : undefined;
      if (maxTurnsText && (!Number.isInteger(maxTurns) || maxTurns! < 1)) {
        ctx.ui.notify("max-turns must be a positive integer.", "error");
        return;
      }
      const projectRoot = process.cwd();
      const simulation = createSimulation(projectRoot, sceneId, { maxTurns });
      ctx.ui.notify(`Simulation '${simulation.id}' started.`, "info");
      while (loadSimulation(projectRoot, simulation.id).status === "running") {
        await runNextResolvedTurn(
          projectRoot,
          simulation.id,
          ({ context }) => runActorWithPi({ projectRoot, context, model: ctx.model }),
          ({ context }) => runArbiterWithPi({ projectRoot, context, model: ctx.model }),
        );
      }
      const replay = simulationReplay(projectRoot, simulation.id);
      ctx.ui.notify(`Simulation '${simulation.id}' completed with ${replay.transcript.length} turns.`, "info");
      pi.sendMessage({ customType: "pi-narrative-simulation", content: JSON.stringify(replay, null, 2), display: true });
    },
  });

  pi.registerCommand("narrative-state", {
    description: "Show current replayed narrative state",
    handler: async (_args, ctx) => {
      const state = loadNarrativeState(process.cwd());
      pi.sendMessage({ customType: "pi-narrative-state", content: JSON.stringify(state, null, 2), display: true });
      ctx.ui.notify(`Narrative state revision ${state.revision}.`, "info");
    },
  });

  pi.registerCommand("narrative-flow", {
    description: "Show deterministic game-narrative flow: /narrative-flow [scene-id]",
    handler: async (args, ctx) => {
      const sceneId = args.trim() || undefined;
      const snapshot = narrativeFlowSnapshot(process.cwd(), { sceneId });
      pi.sendMessage({ customType: "pi-narrative-flow", content: JSON.stringify(snapshot, null, 2), display: true });
      ctx.ui.notify(`Narrative flow at state revision ${snapshot.stateRevision}.`, "info");
    },
  });

  pi.registerCommand("choices", {
    description: "List currently available choices: /choices [scene-id]",
    handler: async (args, ctx) => {
      const sceneId = args.trim() || undefined;
      const choices = availableChoices(process.cwd(), { sceneId });
      pi.sendMessage({ customType: "pi-narrative-choices", content: JSON.stringify(choices, null, 2), display: true });
      ctx.ui.notify(`${choices.length} choice(s) currently available.`, "info");
    },
  });

  pi.registerCommand("choose", {
    description: "Apply an authored player choice: /choose <choice-id> <option-id>",
    handler: async (args, ctx) => {
      const [choiceId, optionId] = args.trim().split(/\s+/);
      if (!choiceId || !optionId) {
        ctx.ui.notify("Usage: /choose <choice-id> <option-id>", "error");
        return;
      }
      const choice = evaluateChoice(process.cwd(), choiceId);
      const option = choice.options.find((item) => item.id === optionId);
      if (!choice.available || !option?.available) {
        ctx.ui.notify(`Choice option '${choiceId}/${optionId}' is not currently available.`, "error");
        return;
      }
      const state = loadNarrativeState(process.cwd());
      const ok = await ctx.ui.confirm(
        "Apply narrative choice?",
        `Apply '${choiceId}/${optionId}' at state revision ${state.revision}? This appends an authoritative event.`,
      );
      if (!ok) {
        ctx.ui.notify("Choice cancelled.", "info");
        return;
      }
      const applied = applyChoice(process.cwd(), choiceId, optionId, { expectedRevision: state.revision });
      pi.sendMessage({ customType: "pi-narrative-choice", content: JSON.stringify(applied, null, 2), display: true });
      ctx.ui.notify(`Choice '${choiceId}/${optionId}' applied at revision ${applied.state.revision}.`, "info");
    },
  });

  pi.registerCommand("quests", {
    description: "Show derived quest/objective states",
    handler: async (_args, ctx) => {
      const quests = evaluateQuests(process.cwd());
      pi.sendMessage({ customType: "pi-narrative-quests", content: JSON.stringify(quests, null, 2), display: true });
      ctx.ui.notify(`${quests.length} quest(s) evaluated.`, "info");
    },
  });

  pi.registerCommand("timeline", {
    description: "Evaluate narrative timeline/continuity constraints",
    handler: async (_args, ctx) => {
      const timeline = evaluateTimeline(process.cwd());
      pi.sendMessage({ customType: "pi-narrative-timeline", content: JSON.stringify(timeline, null, 2), display: true });
      ctx.ui.notify(timeline.valid ? "Timeline constraints satisfied/pending." : "Timeline constraint violation detected.", timeline.valid ? "info" : "error");
    },
  });

  pi.registerCommand("canonize", {
    description: "Approve a draft scene into immutable canon: /canonize <scene-id>",
    handler: async (args, ctx) => {
      const sceneId = args.trim();
      if (!sceneId) {
        ctx.ui.notify("Usage: /canonize <scene-id>", "error");
        return;
      }
      const check = validateScene(process.cwd(), sceneId, "drafts");
      if (!check.valid) {
        ctx.ui.notify(`Draft is invalid: ${check.errors.join("; ")}`, "error");
        return;
      }
      const ok = await ctx.ui.confirm(
        "Canonize scene?",
        `This will copy drafts/${sceneId}.json into canon and refuse to overwrite it. Continue?`,
      );
      if (!ok) {
        ctx.ui.notify("Canonization cancelled.", "info");
        return;
      }
      canonizeDraft(process.cwd(), sceneId, { approvedBy: "human-via-pi" });
      ctx.ui.notify(`Scene '${sceneId}' is now canon.`, "info");
    },
  });
}
