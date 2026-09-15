# Engine Integration Protocol

## Boundary

Pi Narrative remains the authoring/simulation runtime. Unity or another game engine is a consumer.

```text
initial state + NarrativeEvents
          ↓ replay
     narrative state
          ↓ export
EngineExport DTO
          ↓
Unity / game runtime
          ↓ execute consequence
local deliveryId ledger
          ↓ ACK
runtime/<consumer>/acks.json
```

ACK state is integration state, not narrative truth.

## Delivery semantics

The protocol is **at-least-once**.

A consequence receives a deterministic ID:

```text
pn-<eventRevision>-<eventId>-<index>
```

A game runtime MUST deduplicate by this ID before applying side effects. The dangerous crash window is:

```text
apply side effect → crash → ACK never persisted
```

Pi Narrative will redeliver after restart. Therefore the consumer's applied-ID ledger is mandatory for effectively-once behavior.

## Engine export

`EngineExport` contains:

- protocol + integer schema version
- project / consumer identity
- event cursor
- Unity-friendly narrative state DTO
- pending unacknowledged consequences
- stable localization entries
- deterministic `snapshotId`
- non-deterministic `generatedAt`

`generatedAt` is intentionally excluded from `snapshotId`.

## Unity DTO design

Public state uses arrays:

- characters[]
- attributes[]
- resources[]
- relationships[]
- worldFlags[]

Arbitrary values cross the boundary through a typed-value envelope. Complex values fall back to canonical JSON strings. This avoids requiring runtime dictionaries at the conservative Unity `JsonUtility` boundary.

## ACK ledger

Each consumer owns:

```text
narrative/runtime/<consumerId>/acks.json
```

ACK is idempotent. Unknown delivery IDs are rejected rather than silently accepted.

## Save snapshot

A save snapshot contains:

- current narrative state DTO
- current event cursor
- acknowledged delivery IDs
- deterministic snapshot ID
- optional runtime metadata

It is an engine-facing resume artifact; it does not replace the authoring event log.

## Checkpoint

A checkpoint hashes:

- replayed state at revision N
- exact event-log prefix through revision N
- ordered event IDs

A later event does not invalidate an older checkpoint; mutation of the checkpointed prefix does.

## Project schema migration

v0.5 introduces integer project schema version 1:

```json
{
  "protocol": "pi-narrative.project/v1",
  "schemaVersion": 1
}
```

Earlier manifests used string labels such as `"0.4"`. Migration is explicit; when such a label is encountered it is preserved as `legacySchemaVersion`.

## CI

```bash
node scripts/validate-project.mjs examples/roadside-station
```

The validator checks project-schema compatibility, state replay, consequence envelopes, localization-key uniqueness, and engine export serialization.
