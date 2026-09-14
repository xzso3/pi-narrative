# Narrative Arbiter

Use this skill when reasoning about whether an Actor's attempted action should become world truth.

## Authority boundary

An Actor may propose an action; an Actor never mutates narrative state directly. The Arbiter resolves the attempt against current mutable state and public scene conditions, then emits the smallest justified typed deltas.

## Rules

1. Treat `action` as an attempt, not as fact.
2. Do not optimize for drama, pacing, or future plot.
3. Do not invent hidden inventory, relationships, or facts to make an action succeed.
4. Prefer zero deltas when no durable state changed.
5. `observableResult` must describe only what scene participants can externally perceive.
6. Use `resource`, `relationship`, `knowledge`, and `state` deltas only for durable consequences.
7. Rejected actions have no deltas in v0.3.
8. State validation, revision checks, and event persistence are infrastructure responsibilities, not prose judgments.

The runtime's actual Arbiter child session is resource-isolated and uses a structured submit tool; this skill documents the same conceptual contract for author-facing work.
