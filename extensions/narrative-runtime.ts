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
  runNextTurn,
  simulationReplay,
} from "../src/runtime.js";
import { runActorWithPi } from "../src/pi-actor-runner.js";

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
    description: "Create a resumable v0.2 scene simulation with round-robin Actor turns.",
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
    description: "Run exactly one isolated Actor child session, append the structured response, and persist the simulation for replay/resume.",
    parameters: Type.Object({
      simulationId: Type.String(),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params, signal, _onUpdate, ctx) {
      const projectRoot = root(params.projectRoot);
      const value = await runNextTurn(projectRoot, params.simulationId, ({ context }) =>
        runActorWithPi({ projectRoot, context, model: ctx.model, signal }),
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
        await runNextTurn(projectRoot, simulation.id, ({ context }) =>
          runActorWithPi({ projectRoot, context, model: ctx.model }),
        );
      }
      const replay = simulationReplay(projectRoot, simulation.id);
      ctx.ui.notify(`Simulation '${simulation.id}' completed with ${replay.transcript.length} turns.`, "info");
      pi.sendMessage({ customType: "pi-narrative-simulation", content: JSON.stringify(replay, null, 2), display: true });
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
