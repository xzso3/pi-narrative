# Implementation log

## 2026-09-14 — MVP framing

Decision: first prove deterministic narrative-state boundaries before implementing multi-agent orchestration.

## 2026-09-14 — Domain core

Implemented harness-independent JSON loaders, Actor Context builder, scene validator, simulation persistence, canonization, and project status.

## 2026-09-14 — Pi adapter

Implemented a TypeScript extension registering four tools and two commands. Canonization requires a Pi UI confirmation.

## 2026-09-14 — Skills

Added Director, Roleplay Actor, Scene Writer, and Narrative Reviewer skills. Their responsibilities are intentionally separate.

## 2026-09-14 — Regression fixture

Added Roadside Station demo containing one deliberate author-only future fact and another character's secret. Tests assert these do not leak into Mara's Actor Context.

## 2026-09-15 — v0.3 Narrative State Engine

Introduced revisioned mutable narrative state with an append-only event log. Added resource, relationship, knowledge, and generic public-state deltas plus deterministic validators.

## 2026-09-15 — Arbiter authority boundary

Added a separate Pi Arbiter child session. Actor actions are now explicit attempts; only validated Arbiter decisions become mutable world truth.

## 2026-09-15 — Replay and recovery

Made `initial.json + events/*` authoritative and `current.json` rebuildable. Added base-revision conflict checks and deterministic recovery when an event is committed before the matching simulation transcript update.

## 2026-09-15 — Child-session hardening

Cross-checked current Pi SDK resource-loader behavior and disabled extensions, skills, prompt templates, themes, context files, and appended system prompts in Actor/Arbiter sessions. Each child session exposes only its structured submit tool.
