import {
  createAgentSession,
  DefaultResourceLoader,
  defineTool,
  getAgentDir,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const StateDelta = Type.Union([
  Type.Object({
    type: Type.Literal("resource"),
    characterId: Type.String(),
    resourceId: Type.String(),
    op: Type.Union([Type.Literal("increment"), Type.Literal("set")]),
    value: Type.Number(),
  }),
  Type.Object({
    type: Type.Literal("relationship"),
    fromCharacterId: Type.String(),
    toCharacterId: Type.String(),
    metric: Type.String(),
    op: Type.Union([Type.Literal("increment"), Type.Literal("set")]),
    value: Type.Number(),
  }),
  Type.Object({
    type: Type.Literal("knowledge"),
    characterId: Type.String(),
    factId: Type.String(),
    op: Type.Literal("add"),
  }),
  Type.Object({
    type: Type.Literal("state"),
    scope: Type.Union([Type.Literal("character"), Type.Literal("world")]),
    characterId: Type.Optional(Type.String()),
    key: Type.String(),
    op: Type.Union([Type.Literal("increment"), Type.Literal("set")]),
    value: Type.Union([Type.Number(), Type.String(), Type.Boolean()]),
  }),
]);

const ArbiterDecisionParams = Type.Object({
  outcome: Type.Union([Type.Literal("accepted"), Type.Literal("rejected"), Type.Literal("partial")]),
  observableResult: Type.String({ description: "Only what scene participants could externally perceive as the result." }),
  reason: Type.Optional(Type.String({ description: "Resolver rationale for logs; never character dialogue." })),
  deltas: Type.Array(StateDelta),
});

function arbiterSystemPrompt(context: unknown) {
  return [
    "You are the environment arbiter for a game-narrative simulation, not an author and not a character.",
    "Resolve only whether the attempted action succeeds given the supplied current state and public scene conditions.",
    "Do not optimize for drama, plot progression, or future plans. Do not invent hidden resources or facts.",
    "The actor's declared action is an attempt, not truth. Only your accepted validated deltas become world state.",
    "Keep deltas minimal. If an action has no durable state consequence, return an empty deltas array.",
    "You MUST finish by calling submit_arbiter_decision exactly once. Do not answer with free-form prose.",
    "",
    JSON.stringify(context, null, 2),
  ].join("\n");
}

export async function runArbiterWithPi({ projectRoot, context, model, signal }: any) {
  let captured: any = null;
  const submit = defineTool({
    name: "submit_arbiter_decision",
    label: "Submit Arbiter Decision",
    description: "Resolve the attempted action into an observable result and constrained state deltas.",
    parameters: ArbiterDecisionParams,
    execute: async (_id: string, params: any) => {
      if (captured) throw new Error("ArbiterDecision already submitted.");
      captured = params;
      return { content: [{ type: "text", text: "ArbiterDecision accepted for deterministic validation." }], details: params };
    },
  });

  const loader = new DefaultResourceLoader({
    cwd: projectRoot,
    agentDir: getAgentDir(),
    noExtensions: true,
    noSkills: true,
    noPromptTemplates: true,
    noThemes: true,
    noContextFiles: true,
    appendSystemPromptOverride: () => [],
    systemPromptOverride: () => arbiterSystemPrompt(context),
  });
  await loader.reload();

  const { session } = await createAgentSession({
    cwd: projectRoot,
    ...(model ? { model } : {}),
    noTools: "builtin",
    customTools: [submit],
    resourceLoader: loader,
    sessionManager: SessionManager.inMemory(),
  });

  try {
    if (signal?.aborted) throw new Error("Arbiter turn aborted before start.");
    await session.prompt("Resolve the attempted action now and submit exactly one structured decision.");
    if (!captured) throw new Error("Arbiter session finished without submit_arbiter_decision.");
    return captured;
  } finally {
    session.dispose();
  }
}
