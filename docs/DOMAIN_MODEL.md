# Domain model v0.4

The schema remains intentionally JSON-based, deterministic, and reviewable in Git.

## Authored narrative layer

### Project

- `schemaVersion`
- `id`
- `title`
- `sceneOrder[]`

### WorldFact

- `id`
- `text`
- `actorVisible` — hard boundary for author-only facts

### Character

- identity / desire / fear
- boundaries / speech
- authored baseline state/relationships
- knowledge.factIds / privateFacts

### Scene

- id/title/location/situation
- cast[]
- publicFactIds[] / publicEvents[]
- actorGoals{}
- optional `entryCondition`
- optional `exitCondition`
- outcome metadata

## Runtime simulation layer

### ActorResponse

- `intent` — private
- `action` — attempted externally observable action
- optional `dialogue`
- optional `rationale` — private
- optional `emotionalShift` — private

### ArbiterDecision

- `outcome`: `accepted | rejected | partial`
- `observableResult`
- optional private `reason`
- `deltas[]`

### StateDelta

- `resource`
- `relationship`
- `knowledge`
- `state`

### NarrativeEvent

v0.4 adds a typed `source`:

- `actor-turn`
- `choice`
- `system`

Events also contain revision bounds, observable result, validated deltas, optional private Actor recovery data, and optional `gameplayConsequences[]`.

### Mutable Narrative State

- protocol / revision
- characters{id: attributes/resources/relationships/knowledge}
- world.flags

`state/initial.json + events/*` remains authoritative.

## Game semantics layer

### Condition

Declarative predicate tree using:

- `const`
- `all`
- `any`
- `not`
- `compare`
- `event`

### Choice

- id / sceneId / prompt
- singleUse
- availableWhen
- options[]
  - id / label
  - availableWhen
  - outcomeText
  - deltas[]
  - gameplayConsequences[]

### BranchRule

- id
- fromSceneId
- targetSceneId
- priority
- when

### Quest

- id / title
- availableWhen / failWhen / completeWhen
- objectives[]
  - id / title
  - dependsOn[]
  - availableWhen / completeWhen / failWhen

Quest/objective status is derived as `locked | active | completed | failed`.

### TimelineConstraint

- `condition-requires`
- `event-before`

### GameplayConsequence

An engine-agnostic descriptor persisted on semantic events. v0.4 records/exposes these but does not execute them.

## Production layer

### Draft / Canon

Draft and Canon remain authored script outputs. Mutable runtime state and game-flow semantics do not automatically become approved canon.
