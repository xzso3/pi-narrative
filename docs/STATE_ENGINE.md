# Narrative State Engine

## State layout

```text
narrative/
├── state/
│   ├── initial.json
│   └── current.json
└── events/
    ├── 000001-<event-id>.json
    ├── 000002-<event-id>.json
    └── ...
```

`initial.json` is the revision-0 snapshot. Events are ordered by revision-prefixed filenames. `current.json` is only a cache and may be reconstructed at any time.

## State shape

```json
{
  "protocol": "pi-narrative.state/v0.3",
  "revision": 0,
  "characters": {
    "mara": {
      "attributes": { "fatigue": 0.62 },
      "resources": { "fuelLiters": 2 },
      "relationships": { "oren": { "trust": 0.15 } },
      "knowledge": { "factIds": ["bridge-rumor"] }
    }
  },
  "world": {
    "flags": { "dustStormApproaching": true }
  }
}
```

`world.flags` are actor-visible public mutable state in v0.3. Do not store author secrets there.

## Turn resolution

```text
ActorResponse.action
      │ attempted action
      ▼
ArbiterContext
      │ no Actor intent/rationale/emotion
      ▼
ArbiterDecision
      │
      ├── outcome: accepted | rejected | partial
      ├── observableResult
      └── deltas[]
             │
             ▼
validateArbiterDecision
             │
             ▼
commitNarrativeEvent(expected revision)
             │
             ▼
append event → replay → current cache
```

The LLM never writes JSON state files directly.

## Delta vocabulary

### ResourceDelta

```json
{
  "type": "resource",
  "characterId": "mara",
  "resourceId": "fuelLiters",
  "op": "increment",
  "value": 5
}
```

Resources are finite numeric values and may not become negative.

### RelationshipDelta

```json
{
  "type": "relationship",
  "fromCharacterId": "mara",
  "toCharacterId": "oren",
  "metric": "trust",
  "op": "increment",
  "value": 0.1
}
```

Relationship metrics are bounded to `[-1, 1]`.

### KnowledgeDelta

```json
{
  "type": "knowledge",
  "characterId": "mara",
  "factId": "underground-reserve",
  "op": "add"
}
```

The fact must already exist in `world.json` and must not have `actorVisible: false`. v0.3 knowledge is monotonic: only `add` exists.

### StateDelta

```json
{
  "type": "state",
  "scope": "world",
  "key": "pumpBroken",
  "op": "set",
  "value": true
}
```

Character-scope state writes `attributes`; world-scope state writes public `world.flags`.

## Replay and concurrency

Every event stores `revisionBefore` and `revisionAfter`. Commit may supply `baseRevision`; if it does not match current replayed state, the write fails. Replay verifies a contiguous revision chain and validates every event again before applying it.

This is optimistic concurrency, not distributed locking. It is enough for the MVP's single-project local pipeline and gives future orchestration a clear conflict primitive.

## Crash recovery

The event is written before the simulation transcript. A deterministic event id (`<simulation>-turn-<n>`) plus the private structured ActorResponse stored in the internal event allows the next run to reconstruct the missing simulation turn without invoking Actor/Arbiter again. Actor-facing replay still filters private fields.
