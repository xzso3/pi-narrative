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

## v0.4 — Game narrative semantics ✅

- Declarative predicates over mutable state/event history.
- Deterministic scene entry/exit gates.
- Authored player choices with validated effects.
- Branch resolution with target-gate enforcement.
- Derived quest/objective state machines.
- Timeline ordering and continuity constraints.
- Persisted engine-facing gameplay consequence descriptors.
- Unified flow inspection through Pi tools/commands.

## v0.5 — Engine/export layer

- Stable external semantic schema and localization IDs.
- Unity-friendly export/import package.
- Gameplay consequence acknowledgement/idempotency contract.
- Validation report suitable for CI.
- Snapshot/checkpoint strategy for long event logs.
- Migration/versioning rules for narrative project data.

## v0.6 — Authoring UX

- Narrative dashboard / graph view.
- Scene/choice/quest/event diff and review UI.
- Character knowledge/state inspector.
- Timeline/branch visualization.
- Pi SDK/RPC-backed authoring application.
