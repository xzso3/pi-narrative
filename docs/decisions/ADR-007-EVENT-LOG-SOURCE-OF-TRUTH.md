# ADR-007 — Event log is the mutable-state source of truth

**Status:** Accepted in v0.3

## Decision

`narrative/state/initial.json` plus ordered files under `narrative/events/` define current mutable state. `narrative/state/current.json` is a cache only.

## Why

A single mutable snapshot hides causality and is difficult to review, recover, diff, or reproduce. Event sourcing keeps every accepted state transition attributable to a simulation turn and supports deterministic replay.

## Consequences

- Event revisions must form a contiguous chain.
- Editing historical events changes replay semantics and should be treated as a deliberate source edit.
- Long projects will eventually need snapshots/checkpoints for performance; v0.3 replays all events.
