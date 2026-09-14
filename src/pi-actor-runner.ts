import {
  createAgentSession,
  DefaultResourceLoader,
  defineTool,
  getAgentDir,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const ActorResponseParams = Type.Object({
  intent: Type.String({ description: "Private immediate intention. Never exposition for another character." }),
  action: Type.String({ description: "Externally observable physical or social action." }),
  dialogue: Type.Optional(Type.String({ description: "Words spoken aloud, if any." })),
  rationale: Type.Optional(Type.String({ description: "Private reasoning grounded only in the supplied Actor context." })),
  emotionalShift: Type.Optional(Type.Record(Type.String(), Type.Number())),
});

function actorSystemPrompt(context: unknown) {
  return [
    "You are one Actor inside a game-narrative simulation, not the author or director.",
    "The JSON context below is your complete epistemic world. Information absent from it does not exist for you.",
    "When authored character data and mutableState differ, mutableState is the current truth.",
    "Never optimize for plot progression. Pursue the character's immediate goal plausibly.",
    "Do not narrate author plans or infer other characters' private thoughts.",
    "You MUST finish by calling submit_actor_response exactly once. Do not answer with free-form prose.",
    "",
    JSON.stringify(context, null, 2),
  ].join("\n");
}

export async function runActorWithPi({ projectRoot, context, model, signal }: any) {
  let captured: any = null;
  const submit = defineTool({
    name: "submit_actor_response",
    label: "Submit Actor Response",
    description: "Submit this Actor's structured private intent and observable behavior, then end the turn.",
    parameters: ActorResponseParams,
    execute: async (_id: string, params: any) => {
      if (captured) throw new Error("ActorResponse already submitted.");
      captured = params;
      return { content: [{ type: "text", text: "ActorResponse accepted. End the turn now." }], details: params };
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
    systemPromptOverride: () => actorSystemPrompt(context),
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
    if (signal?.aborted) throw new Error("Actor turn aborted before start.");
    await session.prompt("Act now. Use only the supplied context and submit your structured response.");
    if (!captured) throw new Error("Actor session finished without submit_actor_response.");
    return captured;
  } finally {
    session.dispose();
  }
}
