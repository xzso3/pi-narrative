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

## v0.5 — Engine/export layer ✅

- Stable versioned engine DTO and localization IDs.
- Unity-friendly array DTO sketch.
- Stable gameplay consequence delivery IDs.
- At-least-once delivery + durable per-consumer ACK contract.
- Save-game snapshots carrying state/cursor/ACK state.
- Hash-verified event-log checkpoints.
- CI validator and GitHub Actions workflow.
- Explicit project schema migration/versioning rules.

## v0.6 — Authoring UX

- Narrative dashboard / graph view.
- Scene/choice/quest/event diff and review UI.
- Character knowledge/state inspector.
- Timeline/branch visualization.
- Pi SDK/RPC-backed authoring application.

## Later

- Transport adapters (Pi RPC / local IPC / HTTP bridge) for engine consumers.
- Generated Unity package / schema codegen.
- Localization translation pipeline.
- Multiplayer authority and replication semantics.
