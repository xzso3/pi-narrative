---
name: game-narrative-semantics
description: Design deterministic game narrative conditions, player choices, branches, quests, scene gates, timeline constraints, and gameplay consequences for Pi Narrative v0.4.
---

# Game Narrative Semantics

Use this skill when turning authored narrative intent into deterministic game-flow rules.

## Core rule

Do not encode game logic as prose and do not ask an LLM to decide whether a condition is true. Author declarative predicates that the runtime can evaluate against mutable state and event history.

## Predicate vocabulary

Use only the v0.4 DSL:

- `const`
- `all`
- `any`
- `not`
- `compare`
- `event`

A state comparison looks like:

```json
{
  "op": "compare",
  "path": "characters.mara.resources.fuelLiters",
  "comparator": "gte",
  "value": 10
}
```

An event-history predicate looks like:

```json
{
  "op": "event",
  "selector": {
    "sourceType": "choice",
    "choiceId": "departure",
    "optionId": "trade-medicine-for-fuel"
  }
}
```

Never embed JavaScript, template expressions, shell commands, or free-form code in conditions.

## Choices

A Choice is authored game logic, not an Actor simulation result. Each option may contain:

- `availableWhen`
- human-readable `outcomeText`
- deterministic `deltas[]`
- engine-facing `gameplayConsequences[]`

Because these effects are authored rules, they are committed directly as revisioned NarrativeEvents. Do not route authored choice effects through the LLM Arbiter.

## Branches

A branch declares:

- `fromSceneId`
- `targetSceneId`
- optional `priority`
- `when`

A branch is available only if its own predicate is true **and** the target scene's entry gate is true.

## Quests and objectives

Quest/objective status is derived, never independently mutated.

Objective statuses:

- `locked`
- `active`
- `completed`
- `failed`

Use `dependsOn` only on earlier objectives. Prefer predicates over bespoke quest-state flags unless a durable world fact is genuinely required by gameplay.

## Scene gates

Use `entryCondition` to decide whether a scene can start. `createSimulation()` enforces this gate.

Use `exitCondition` to express when the current scene's narrative purpose is resolved. An exit condition does not automatically choose the next scene; branch rules do that.

## Timeline constraints

Use `condition-requires` for continuity invariants such as “if Mara departed north, she must have enough fuel.”

Use `event-before` for ordering invariants between durable events.

A violation is a data/continuity error, not a prompt suggestion.

## Gameplay consequences

`gameplayConsequences[]` are declarative engine-facing descriptors such as route unlocks, checkpoints, encounter triggers, or item consumption. v0.4 persists and exposes them but does not execute Unity/game-engine behavior itself.

## Authoring checklist

Before considering a semantic asset complete:

1. Every condition is deterministic and minimal.
2. Choice effects cannot violate StateDelta invariants.
3. Single-use choices are explicit when appropriate.
4. Branch targets have compatible scene-entry gates.
5. Quest completion is derivable from actual world/event state.
6. Timeline constraints cover irreversible continuity assumptions.
7. Gameplay consequences describe engine intent without duplicating narrative state.
