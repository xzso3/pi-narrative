# ADR-011 — Quest, branch, and gate state are derived views

## Status

Accepted in v0.4.

## Decision

Quest/objective status, available branches, scene gates, and available choices are derived from replayed mutable state plus event history. They are not maintained as an independent mutable state store.

## Why

Duplicating these statuses would introduce synchronization bugs and make replay ambiguous. The event log already provides a deterministic source of truth.

## Consequence

Deleting caches or restarting the process cannot lose game-flow state. Replaying the same narrative events recreates the same flow snapshot.
