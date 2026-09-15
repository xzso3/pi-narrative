import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
  acknowledgeConsequences,
  buildEngineExport,
  buildSaveGameSnapshot,
  createCheckpoint,
  migrateProjectSchema,
  validateProjectForEngine,
  writeEngineExport,
  writeSaveGameSnapshot,
} from "../src/engine-integration.js";

function root(input?: string) {
  return path.resolve(input || process.cwd());
}

function result(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    details: value,
  };
}

export default function engineIntegration(pi: ExtensionAPI) {
  pi.registerTool({
    name: "narrative_engine_export",
    label: "Narrative Engine Export",
    description: "Build or persist a Unity-friendly deterministic engine export. Consequences use stable deliveryIds and at-least-once delivery semantics.",
    parameters: Type.Object({
      consumerId: Type.Optional(Type.String()),
      includeLocalization: Type.Optional(Type.Boolean()),
      write: Type.Optional(Type.Boolean()),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      const projectRoot = root(params.projectRoot);
      const options = {
        consumerId: params.consumerId ?? "unity",
        includeLocalization: params.includeLocalization ?? true,
      };
      return result(params.write ? writeEngineExport(projectRoot, options) : buildEngineExport(projectRoot, options));
    },
  });

  pi.registerTool({
    name: "narrative_engine_ack",
    label: "Acknowledge Narrative Consequences",
    description: "Mutating integration operation. Durably ACK stable gameplay consequence deliveryIds for one consumer. Repeated ACKs are idempotent.",
    parameters: Type.Object({
      consumerId: Type.String(),
      deliveryIds: Type.Array(Type.String(), { minItems: 1 }),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(acknowledgeConsequences(root(params.projectRoot), params.consumerId, params.deliveryIds));
    },
  });

  pi.registerTool({
    name: "narrative_save_snapshot",
    label: "Narrative Save Snapshot",
    description: "Build or persist an engine save snapshot containing state, cursor, and durable ACK state.",
    parameters: Type.Object({
      consumerId: Type.Optional(Type.String()),
      slotId: Type.Optional(Type.String()),
      write: Type.Optional(Type.Boolean()),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      const options = { consumerId: params.consumerId ?? "unity", slotId: params.slotId ?? "autosave" };
      return result(params.write ? writeSaveGameSnapshot(root(params.projectRoot), options) : buildSaveGameSnapshot(root(params.projectRoot), options));
    },
  });

  pi.registerTool({
    name: "narrative_checkpoint",
    label: "Narrative Checkpoint",
    description: "Create a hash-verified derived checkpoint of the current event-log prefix and replayed state.",
    parameters: Type.Object({
      label: Type.Optional(Type.String()),
      projectRoot: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      return result(createCheckpoint(root(params.projectRoot), { ...(params.label ? { label: params.label } : {}) }));
    },
  });

  pi.registerTool({
    name: "narrative_engine_validate",
    label: "Validate Narrative Engine Project",
    description: "Run deterministic engine-integration validation suitable for CI.",
    parameters: Type.Object({ projectRoot: Type.Optional(Type.String()), consumerId: Type.Optional(Type.String()) }),
    async execute(_id, params) {
      return result(validateProjectForEngine(root(params.projectRoot), { consumerId: params.consumerId ?? "ci" }));
    },
  });

  pi.registerTool({
    name: "narrative_project_migration_preview",
    label: "Preview Narrative Project Migration",
    description: "Preview the deterministic project schema migration without writing files.",
    parameters: Type.Object({ projectRoot: Type.Optional(Type.String()) }),
    async execute(_id, params) {
      return result(migrateProjectSchema(root(params.projectRoot), { write: false }));
    },
  });

  pi.registerCommand("engine-export", {
    description: "Write a Unity-friendly engine export: /engine-export [consumer-id]",
    handler: async (args, ctx) => {
      const consumerId = args.trim() || "unity";
      const output = writeEngineExport(process.cwd(), { consumerId });
      pi.sendMessage({ customType: "pi-narrative-engine-export", content: JSON.stringify(output.document, null, 2), display: true });
      ctx.ui.notify(`Engine export written for '${consumerId}' at revision ${output.document.cursor.revision}.`, "info");
    },
  });

  pi.registerCommand("engine-ack", {
    description: "ACK delivered engine consequences: /engine-ack <consumer-id> <delivery-id> [delivery-id...]",
    handler: async (args, ctx) => {
      const [consumerId, ...deliveryIds] = args.trim().split(/\s+/).filter(Boolean);
      if (!consumerId || deliveryIds.length === 0) {
        ctx.ui.notify("Usage: /engine-ack <consumer-id> <delivery-id> [delivery-id...]", "error");
        return;
      }
      const ok = await ctx.ui.confirm("Acknowledge gameplay consequences?", `Persist ACK for ${deliveryIds.length} delivery id(s) for consumer '${consumerId}'?`);
      if (!ok) return;
      const acknowledged = acknowledgeConsequences(process.cwd(), consumerId, deliveryIds);
      pi.sendMessage({ customType: "pi-narrative-engine-ack", content: JSON.stringify(acknowledged, null, 2), display: true });
      ctx.ui.notify(`${acknowledged.newlyAcked.length} new ACK(s), ${acknowledged.alreadyAcked.length} already ACKed.`, "info");
    },
  });

  pi.registerCommand("engine-save", {
    description: "Write an engine save snapshot: /engine-save [consumer-id] [slot-id]",
    handler: async (args, ctx) => {
      const [consumerId = "unity", slotId = "autosave"] = args.trim().split(/\s+/).filter(Boolean);
      const output = writeSaveGameSnapshot(process.cwd(), { consumerId, slotId });
      ctx.ui.notify(`Save snapshot '${slotId}' written at revision ${output.snapshot.cursor.revision}.`, "info");
    },
  });

  pi.registerCommand("engine-checkpoint", {
    description: "Create a derived narrative checkpoint: /engine-checkpoint [label]",
    handler: async (args, ctx) => {
      const label = args.trim() || undefined;
      const output = createCheckpoint(process.cwd(), { ...(label ? { label } : {}) });
      ctx.ui.notify(`Checkpoint '${output.checkpoint.label}' created at revision ${output.checkpoint.revision}.`, "info");
    },
  });

  pi.registerCommand("engine-validate", {
    description: "Validate the project for engine export/CI",
    handler: async (_args, ctx) => {
      const validation = validateProjectForEngine(process.cwd(), { consumerId: "ci" });
      pi.sendMessage({ customType: "pi-narrative-engine-validation", content: JSON.stringify(validation, null, 2), display: true });
      ctx.ui.notify( validation.valid ? "Engine integration validation passed." : "Engine integration validation failed.", validation.valid ? "info" : "error");
    },
  });

  pi.registerCommand("engine-migrate", {
    description: "Migrate project.json to the current deterministic schema",
    handler: async (_args, ctx) => {
      const preview = migrateProjectSchema(process.cwd(), { write: false });
      if (preview.applied.length === 0) {
        ctx.ui.notify(`Project schema is already v${preview.toVersion}.`, "info");
        return;
      }
      const ok = await ctx.ui.confirm("Migrate project schema?", preview.applied.join("\n"));
      if (!ok) return;
      const migrated = migrateProjectSchema(process.cwd(), { write: true });
      ctx.ui.notify(`Project schema migrated v${migrated.fromVersion} -> v${migrated.toVersion}.`, "info");
    },
  });
}
