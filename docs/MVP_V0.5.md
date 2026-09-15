# MVP v0.5 — Engine Integration / Export Layer

## Goal

Prove that Pi Narrative can hand deterministic narrative state and gameplay consequences to a real game runtime without making the game engine depend on Pi sessions or LLM memory.

## In scope

- versioned engine export DTO
- Unity-friendly arrays instead of public dynamic maps
- stable gameplay consequence `deliveryId`
- durable per-consumer ACK ledger
- at-least-once redelivery semantics with consumer-side deduplication
- save-game snapshots containing state/cursor/ACK state
- hash-verified event-log checkpoints
- stable localization IDs with fallback text
- explicit project manifest schema migration
- deterministic CI validator
- Pi tools/commands plus a C# DTO sketch

## Out of scope

- HTTP/WebSocket transport
- automatic Unity package installation
- exactly-once distributed transactions
- restoring Pi's authoring event log from a game save
- multiplayer authority/network replication
- binary asset delivery
- localization translation management
- generated C# source from JSON Schema

## Success criteria

1. Exporting the same narrative revision and ACK state yields the same `snapshotId`.
2. Every gameplay consequence has a stable deterministic `deliveryId`.
3. Repeating an ACK does not duplicate or corrupt integration state.
4. ACKed consequences are absent from subsequent exports for that consumer.
5. Checkpoints detect event-log prefix tampering.
6. Save snapshots carry enough cursor/ACK data for a consumer to resume safely.
7. Legacy string project schema labels can be migrated explicitly without silently discarding the old label.
8. CI validation fails malformed engine-facing consequence data.
