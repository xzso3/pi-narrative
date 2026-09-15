# Domain Model v0.5

The schema is JSON-based, deterministic, Git-reviewable, and split by authority.

## Authored narrative layer

Project: `protocol`, integer `schemaVersion`, `id`, `title`, `sceneOrder[]`.

WorldFact: `id`, `text`, `actorVisible`.

Character: identity/desire/fear, boundaries/speech, authored baseline state/relationships, knowledge.

Scene: identity/location/situation, cast, public facts/events, actor goals, optional entry/exit conditions.

## Runtime simulation layer

ActorResponse: private `intent`, attempted `action`, optional dialogue, private rationale/emotionalShift.

ArbiterDecision: outcome, observable result, optional private reason, deltas.

StateDelta types: resource, relationship, knowledge, state.

NarrativeEvent source types: actor-turn, choice, system. Events hold revision bounds, validated deltas, optional recovery data, and optional gameplay consequences.

Mutable state is authoritative as `state/initial.json + events/*`.

## Game semantics layer

Condition uses `const`, `all`, `any`, `not`, `compare`, `event`.

Choice defines availability, options, deterministic deltas, and gameplay consequences.

BranchRule defines fromSceneId/targetSceneId/priority/when.

Quest/objective status is derived as `locked | active | completed | failed`.

TimelineConstraint supports `condition-requires` and `event-before`.

## Engine integration layer

GameplayConsequences become stable Delivery records.

EngineExport contains protocol/schema, project/consumer identity, event cursor, Unity-friendly state DTO, unacknowledged consequences, localization catalog, and deterministic `snapshotId`.

ACK Ledger is consumer-scoped derived integration state. Save Snapshot carries engine-facing state/cursor/ACK data. Checkpoint hashes event-log prefix + replayed state.

## Production layer

Draft and Canon remain authored script outputs; runtime state and engine delivery state do not automatically become approved canon.
