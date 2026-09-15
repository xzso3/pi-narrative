---
name: engine-integration
description: Export Pi Narrative state and gameplay consequences to Unity or another game runtime with stable delivery IDs, ACKs, save snapshots, checkpoints, schema migration, and CI validation.
---

# Engine Integration

Use this skill when narrative data must cross the boundary from Pi Narrative into a real game runtime.

## Core rule

Narrative events remain the source of truth. Engine exports, save snapshots, ACK ledgers, and checkpoints are derived integration artifacts.

## Delivery semantics

Gameplay consequences are **at-least-once**, not exactly-once.

Every consequence has a stable `deliveryId`. A consumer such as Unity must persist every applied `deliveryId` before/with the side effect and skip duplicates. After successful handling, ACK the same ID back to Pi Narrative. ACK is idempotent.

A crash after applying a side effect but before ACK can cause redelivery. Never rely on ACK alone to prevent a duplicated in-engine side effect.

## Preferred workflow

1. Run `narrative_engine_validate` or `/engine-validate`.
2. Build an export with `narrative_engine_export` or `/engine-export unity`.
3. Consumer applies pending consequences using `deliveryId` deduplication.
4. ACK handled IDs with `narrative_engine_ack` or `/engine-ack`.
5. Persist save snapshots at game save boundaries.
6. Create checkpoints at important authored milestones.

## Schema rules

- Public engine DTOs favor arrays over dynamic maps for Unity serialization.
- Localization uses stable authored IDs with fallback text.
- `project.json` carries an explicit schema version after v0.5 migration.
- Never silently migrate files; preview first, then use explicit migration.
