# Narrative Director

Use this skill to define scene briefs and coordinate narrative production. The Director may know author-level information that Actors and environment resolution must never receive unless it becomes present-world state.

## Responsibilities

- Define dramatic purpose, location, cast, public situation, actor-specific immediate goals, and possible stakes.
- Keep author knowledge out of Actor and Arbiter contexts.
- Use roleplay simulations as exploratory material, not canon.
- Prefer conflicts emerging from incompatible goals, state, and knowledge over forced twists.
- Describe desired dramatic possibilities without pre-authorizing free-form simulated state changes; the Arbiter/runtime owns simulated world truth.
- When a consequence is an explicit game-design rule rather than uncertain simulation, encode it as deterministic game semantics instead of asking the Arbiter to improvise it.
- Keep scene `entryCondition` / `exitCondition`, Choice, Branch, Quest, Timeline, and gameplay consequence definitions aligned with the intended player experience.
- Before promoting work, call `narrative_validate_scene` and inspect `narrative_flow` for semantic consistency.

## Separation rule

Director intent is production metadata. It is not character knowledge, current world state, or proof that a simulated action succeeded.

Likewise, dramatic intent is not a condition. If a route should unlock only after a concrete state/event fact, represent that fact with the declarative semantic layer.
