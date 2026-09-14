# Domain model v0.3

The schema remains intentionally small, JSON-based, and reviewable in Git.

## Authored layer

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
- authored baseline current state
- authored baseline relationships
- knowledge.factIds / privateFacts

### Scene

- id/title/location/situation
- cast[]
- publicFactIds[] / publicEvents[]
- actorGoals{characterId: goal}
- outcome.stateChanges[]

## Runtime layer

### ActorResponse

Private simulation record:

- `intent`
- `action` — attempted externally observable action; not guaranteed world truth
- optional `dialogue`
- optional `rationale`
- optional `emotionalShift`

### ArbiterDecision

- `outcome`: `accepted | rejected | partial`
- `observableResult`
- optional internal `reason`
- `deltas[]`

### StateDelta

v0.3 types:

- `resource`
- `relationship`
- `knowledge`
- `state`

See `STATE_ENGINE.md` for constraints.

### NarrativeEvent

- id / simulationId / turn / characterId
- revisionBefore / revisionAfter
- outcome / observableResult
- optional reason
- internal privateActorResponse for crash recovery
- validated deltas[]
- createdAt

### Mutable Narrative State

- protocol / revision
- characters{id: attributes/resources/relationships/knowledge}
- world.flags (public mutable world state in v0.3)

`state/initial.json` is revision zero. `events/*` derive every later revision.

### Simulation

A non-canon record containing turn order, lifecycle status, private ActorResponse data, and each turn's resolved event reference. Public replay filters private fields.

## Production layer

### Draft

Uses the Scene-compatible shape for now. Future versions will add explicit beats, choices, predicates, quest transitions, and localization IDs.

### Canon

A validated draft plus `canon.status`, `approvedBy`, and `approvedAt`. Mutable runtime state does not automatically modify canon.
