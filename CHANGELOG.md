# Changelog

## 0.5.0 - 2026-09-15

Engine Integration / Export Layer MVP:
- Added versioned Unity-friendly engine export DTOs with deterministic snapshot IDs.
- Added stable gameplay consequence delivery IDs and per-consumer durable ACK ledgers.
- Defined at-least-once delivery semantics with mandatory consumer-side deliveryId deduplication.
- Added incremental consequence export by narrative revision.
- Added save-game snapshots carrying narrative cursor, state, and acknowledged delivery IDs.
- Added hash-verified checkpoints for event-log prefixes and replayed state.
- Added stable localization IDs with fallback authored text.
- Added explicit project schema v1 migration while preserving legacy string schema labels.
- Added deterministic engine-integration CI validator and CLI.
- Added separate Pi engine-integration extension/tools/commands and Unity C# DTO sketch.

## 0.4.0 - 2026-09-15

Game Narrative Semantics MVP:
- Added declarative state/event predicates with no arbitrary code execution.
- Added deterministic scene entry/exit gates and enforced entry gates before simulation creation.
- Added authored player choices with option availability, single-use policy, validated StateDelta effects, and revision checks.
- Added first-class choice/system NarrativeEvent sources while preserving actor-turn recovery fields.
- Added branch resolution that also enforces target scene entry gates.
- Added derived quest/objective state machines with ordered dependencies.
- Added `condition-requires` and `event-before` timeline/continuity constraints.
- Added persisted engine-facing gameplay consequence descriptors.
- Added semantic Pi tools plus `/narrative-flow`, `/choices`, `/choose`, `/quests`, and `/timeline`.
- Expanded Roadside Station into two deterministic routes with gated scenes, quest progression, and timeline validation.

## 0.3.0 - 2026-09-15

Narrative State Engine MVP:
- Added typed resource, relationship, knowledge, and state deltas.
- Added independent Pi Arbiter child sessions; Actor actions are attempts, not world truth.
- Added append-only revisioned NarrativeEvent log and deterministic state replay.
- Added revision conflict detection and rebuildable `state/current.json` cache.
- Added event-before-transcript crash recovery without duplicate model execution or state mutation.
- Added initial-state validation so author-only facts cannot enter mutable character knowledge.
- Hardened Actor and Arbiter child sessions by disabling project extensions, skills, prompt templates, themes, context files, and appended system prompts.
- Added `/narrative-state`, `narrative_state`, and `narrative_event_log`.
- Added Narrative Arbiter skill, state-engine documentation, and ADRs.

## 0.2.0 - 2026-09-15

Actor Runtime MVP:
- Added persisted, resumable scene simulations with deterministic turn scheduling.
- Added structured ActorResponse validation.
- Added public/private transcript separation so mental state cannot leak between Actors.
- Added Pi SDK Actor runner using a fresh isolated child session per turn.
- Added `/simulate-scene` plus simulation start/next/state tools.
- Added replay/resume regression tests.
- Fixed v0.1 canonization test fixture creating the draft directory.

## 0.1.0 - 2026-09-14

First MVP proving the Pi Narrative architecture:
- Pi package manifest with one extension and four skills.
- Knowledge-isolated Actor Context builder.
- Scene validation.
- Structured roleplay simulation persistence.
- Human-confirmed, non-overwriting canonization command.
- Example narrative project and automated domain-core tests.
