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
