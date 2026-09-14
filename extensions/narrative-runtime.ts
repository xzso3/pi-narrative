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
    description: "Validate a scene or draft against the v0.1 narrative project rules.",
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
    description: "Persist a structured roleplay simulation transcript. This does not change canon.",
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

  pi.registerCommand("canonize", {
    description: "Approve a draft scene into immutable v0.1 canon: /canonize <scene-id>",
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
        `This will copy drafts/${sceneId}.json into canon and v0.1 will refuse to overwrite it. Continue?`,
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
