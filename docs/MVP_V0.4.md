# MVP v0.4 — Game Narrative Semantics

## Goal

Prove that Pi Narrative can turn replayed narrative state into deterministic game flow without asking an LLM to interpret game rules.

v0.4 connects the v0.3 world-state simulation layer to game-facing semantics:

```text
Narrative State + Event History
          ↓
Declarative Predicate DSL
          ↓
Scene Gates / Choices / Quests / Branches / Timeline
          ↓
Authoritative Choice Event
          ↓
State revision + gameplay consequence descriptors
```

## In scope

- Declarative conditions: `const`, `all`, `any`, `not`, `compare`, `event`.
- Deterministic scene entry/exit gates.
- Authored player choices with option availability, StateDelta effects, and single-use policy.
- Choice events as first-class revisioned `NarrativeEvent` sources.
- Branch resolution that also checks target scene entry gates.
- Derived quest/objective states with dependency ordering.
- Timeline/continuity constraints:
  - `condition-requires`
  - `event-before`
- Persisted engine-facing `gameplayConsequences` descriptors.
- Pi tools and commands for inspecting/applying the semantic layer.
- Roadside Station demo with two deterministic routes.

## Explicit non-goals

- Executing Unity/game-engine consequences.
- Arbitrary expressions or user-authored JavaScript in predicates.
- General scripting language.
- Quest timers, procedural quest generation, or complex graph cycles.
- Localization/export schema stability.
- Multiplayer/network authority.
- GUI graph editor.

## Success criteria

1. A locked scene cannot be simulated until its entry predicate evaluates true.
2. A player choice can deterministically append a revisioned event and mutate state without an LLM Arbiter.
3. The same state/event history always yields the same choice, quest, branch, gate, and timeline results.
4. Quest state is derived rather than independently mutated.
5. Timeline violations are reported as deterministic continuity errors.
6. Gameplay consequence descriptors survive in the event log for later engine export.
7. v0.1–v0.3 knowledge/state invariants remain intact.
