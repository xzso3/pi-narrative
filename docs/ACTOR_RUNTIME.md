# Actor Runtime v0.3

## Resolved turn pipeline

```text
Persisted Simulation
      ↓ nextActorId()
Actor Context Builder
      ↓ authored knowledge filter + own mutable state + public history
ActorTurnContext
      ↓
resource-isolated Pi Actor child session
      ↓ submit_actor_response
ActorResponse
      │ action = attempt
      ▼
ArbiterContext
  - public scene conditions
  - current mutable state
  - attempted action/dialogue
  - NO Actor intent/rationale/emotion
      ↓
resource-isolated Pi Arbiter child session
      ↓ submit_arbiter_decision
ArbiterDecision
      ↓ deterministic validation
NarrativeEvent
      ↓ append + replay
Mutable State
      ↓
Persist resolved simulation turn
```

## Public vs private transcript

Other Actors may perceive:

- turn number;
- character id;
- attempted action;
- spoken dialogue;
- Arbiter outcome and observable result.

They may not perceive:

- intent;
- rationale;
- emotionalShift;
- Arbiter internal reason;
- author-only facts.

## Session isolation

Actor and Arbiter sessions are ephemeral and use a custom resource loader that disables normal project extensions, skills, prompt templates, themes, context files, and appended system prompts. Each session receives one system prompt and one submit tool.

## Replay and recovery

Simulation JSON stores resolved turns. Mutable world truth is reconstructed separately from `state/initial.json + events/*`.

The runtime commits the deterministic turn event before the transcript update. If interrupted in between, the next run detects the existing event id and reconstructs the turn from its internal structured ActorResponse rather than invoking models or applying state a second time.


## v0.4 scene gate integration

Before a new simulation is created, `createSimulation()` evaluates the scene's deterministic `entryCondition`. A false gate rejects the simulation before any Actor child session starts. This prevents LLM orchestration from bypassing authored game-flow rules.
