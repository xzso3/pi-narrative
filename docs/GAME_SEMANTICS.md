# Game Narrative Semantics v0.4

## Why this layer exists

v0.3 can answer “what changed in the simulated world?” It cannot answer “what content is now available to the player?” v0.4 adds a deterministic semantic layer over replayed state and event history.

The semantic layer is intentionally **not** an LLM rules engine. LLM Actors and the Arbiter may propose/resolve free-form character behavior, but authored game flow is evaluated by code.

## Predicate DSL

Conditions are JSON trees.

### Constant

```json
{ "op": "const", "value": true }
```

### Boolean composition

```json
{
  "op": "all",
  "conditions": [
    { "op": "compare", "path": "characters.mara.resources.fuelLiters", "comparator": "gte", "value": 10 },
    { "op": "compare", "path": "world.flags.departedNorth", "comparator": "eq", "value": true }
  ]
}
```

Supported boolean nodes: `all`, `any`, `not`.

### State comparison

```json
{
  "op": "compare",
  "path": "characters.oren.relationships.mara.trust",
  "comparator": "gte",
  "value": 0.25
}
```

Comparators:

- `exists`
- `not-exists`
- `eq`
- `neq`
- `gt`
- `gte`
- `lt`
- `lte`
- `contains`

Paths are property traversal only. They are not code and cannot invoke functions.

### Event history

```json
{
  "op": "event",
  "selector": {
    "sourceType": "choice",
    "choiceId": "departure",
    "optionId": "accept-shelter"
  }
}
```

Selectors may constrain event id, source type, choice/option id, simulation id, or character id.

## Scene gates

Scenes may include:

```json
{
  "entryCondition": { "op": "..." },
  "exitCondition": { "op": "..." }
}
```

`createSimulation()` now enforces `entryCondition`. `exitCondition` is an inspectable semantic fact; it does not automatically move the player to another scene.

## Choices

Choice files live in `narrative/choices/*.json`.

Each option can specify:

- `availableWhen`
- `outcomeText`
- deterministic `deltas[]`
- `gameplayConsequences[]`

Choice effects are authored game rules. Therefore they bypass the LLM Arbiter and are validated/committed directly by the deterministic State Engine.

By default choices are single-use. Re-selection is rejected after a durable choice event exists.

## Branches

Branch files live in `narrative/branches/*.json`:

```json
{
  "id": "north-after-trade",
  "fromSceneId": "fuel-bargain",
  "targetSceneId": "north-road",
  "priority": 100,
  "when": { "op": "..." }
}
```

A branch is emitted only when both:

1. its `when` condition is true; and
2. the target scene entry condition is true.

This prevents a branch rule from bypassing the target scene's own gate.

## Quests

Quest files live in `narrative/quests/*.json`.

Quest and objective status is derived on demand:

- `locked`
- `active`
- `completed`
- `failed`

Objectives can depend on earlier objectives with `dependsOn`. v0.4 intentionally requires dependencies to point backward in the authored objective list, keeping evaluation deterministic and cycle-free.

There is no separate mutable “quest status” database in v0.4. If the underlying state/event history is replayed, the quest state is reproduced.

## Timeline / continuity constraints

`narrative/timeline.json` supports two constraint forms.

### `condition-requires`

If one semantic fact is true, another must also be true.

Example: if Mara departed north, fuel must be at least ten liters.

### `event-before`

The first matching durable event must precede the second matching event. If the second event has already occurred without a valid earlier first event, the constraint is violated.

Timeline constraints are diagnostic invariants. v0.4 reports violations; it does not automatically rewrite history.

## Gameplay consequences

Choice events may persist descriptors such as:

```json
{ "type": "unlock-route", "id": "north-road" }
```

or:

```json
{ "type": "set-checkpoint", "id": "mile-83-shelter" }
```

These are intentionally engine-agnostic. v0.4 stores and exposes them; v0.5 will define stable export/acknowledgement semantics for Unity or other engines.

## Source-of-truth hierarchy

```text
Authored semantic definitions  → rules
initial.json + events/*         → mutable truth
current.json                    → replay cache
quest/choice/branch results     → derived views
```

Derived quest/flow state should never become a second mutable source of truth.
