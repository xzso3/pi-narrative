# MVP v0.3 — Narrative State Engine

## Hypothesis

Pi Narrative becomes meaningfully useful as a game-narrative pipeline only when character claims and world truth are separate. v0.3 tests whether an LLM Actor can propose behavior while an independent Arbiter resolves consequences into deterministic, replayable state.

## In scope

- Revision-0 `narrative/state/initial.json`.
- Append-only `narrative/events/*.json` as mutable-state source of truth.
- Rebuildable `narrative/state/current.json` cache.
- `resource`, `relationship`, `knowledge`, and generic public `state` deltas.
- Deterministic delta validation.
- Independent ephemeral Pi Arbiter child session.
- Actor action as an attempt, with Arbiter `observableResult` as resolved world truth.
- Actor context receives only its own mutable state plus public world flags.
- Revision conflict detection.
- Replay/resume and event-before-transcript crash recovery.
- Read-only Pi tools for current state and event log.

## Explicitly out of scope

- Quest graphs and branching conditions.
- Timeline/temporal constraint engine.
- Spatial or combat simulation.
- Automatic canon mutation.
- Arbitrary JSON Patch / arbitrary filesystem mutation.
- Private world-state flags. `world.flags` are public in v0.3.
- Removing knowledge from a character.
- Cross-event transactions spanning multiple simulations.

## Success criteria

1. An Actor cannot directly mutate state.
2. A rejected action cannot apply a delta.
3. Resources cannot become negative.
4. Relationship metrics remain within `[-1, 1]`.
5. Author-only facts cannot be added to character knowledge.
6. State replay from revision zero produces the same current state as the cache.
7. Stale expected revisions are rejected.
8. Later Actors see the Arbiter's observable result but not private Actor reasoning or Arbiter log rationale.
9. If an event is durable but the simulation turn was not written before interruption, resume does not rerun the model or duplicate the event.

## Result

Implemented in v0.3 with regression tests. The next MVP should build game-specific semantics on top of this event/state substrate rather than expanding the LLM's mutation authority.
