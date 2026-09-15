# ADR-013 — Integration state is not narrative truth

## Decision

ACK ledgers, engine exports, checkpoints, and save snapshots live outside the authoritative NarrativeEvent stream.

## Why

Acknowledging a delivered side effect does not mean the story changed. Mixing delivery protocol metadata into NarrativeEvents would make replay and authoring semantics depend on a particular game-engine consumer.
