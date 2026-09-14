# ADR-006 — Arbiter owns mutable world truth

**Status:** Accepted in v0.3

## Decision

Actor output is always an attempted action. It cannot directly mutate mutable narrative state. A separate Arbiter produces a structured decision and typed deltas; deterministic code validates and commits those deltas.

## Why

Letting the same character model both desire an outcome and declare that the world accepted it collapses roleplay into author fiat. It also makes resource accounting, knowledge continuity, and gameplay integration unreliable.

## Consequences

- Simulations require an additional model turn per Actor turn.
- State mutation becomes auditable and replayable.
- Future deterministic game rules can replace or precede LLM arbitration without changing Actor contracts.
