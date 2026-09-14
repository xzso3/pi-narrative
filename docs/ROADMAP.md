# Roadmap

## v0.1 — Narrative state boundary ✅

- Pi package skeleton.
- Character knowledge isolation.
- Scene validation.
- Simulation/draft/canon separation.
- Human canon gate.

## v0.2 — Actor Runtime ✅

- Isolated Pi child sessions per Actor turn.
- Structured ActorResponse schema.
- Turn scheduler and perception/action loop.
- Public/private transcript separation.
- Simulation replay and resume.

## v0.3 — Narrative State Engine ✅

- Actor action is an attempt; Arbiter owns world truth.
- Typed resource/relationship/knowledge/state deltas.
- Append-only revisioned NarrativeEvent log.
- Deterministic replay and rebuildable current-state cache.
- Optimistic revision conflict detection.
- Event-before-transcript crash recovery.
- Resource-isolated Actor and Arbiter child sessions.

## v0.4 — Game narrative semantics

- Conditions and predicates over mutable state.
- Player choices and branch transitions.
- Quest/objective state machines.
- Timeline ordering and continuity constraints.
- Explicit gameplay consequences.
- Scene entry/exit conditions.

## v0.5 — Engine/export layer

- Stable external schema and localization IDs.
- Unity-friendly export/import package.
- Validation report suitable for CI.
- Snapshot/checkpoint strategy for long event logs.

## v0.6 — Authoring UX

- Narrative dashboard / graph view.
- Scene and event diff/review UI.
- Character knowledge/state inspector.
- Pi SDK/RPC-backed authoring application.
