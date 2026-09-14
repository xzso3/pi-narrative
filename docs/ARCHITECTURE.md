# Architecture v0.3

## Layering

```text
Pi authoring session
 ├─ Skills: Director / Writer / Reviewer / Arbiter methodology
 └─ Extension: commands and deterministic tool boundary
          │
          ▼
 Harness-independent runtime
 ├─ core.js          authored data + epistemic filtering
 ├─ runtime.js       scene turn orchestration
 └─ state-engine.js  event sourcing + deterministic mutation rules
          │
          ├──────────────┐
          ▼              ▼
 isolated Actor      isolated Arbiter
 Pi child session    Pi child session
          │              │
          └──────┬───────┘
                 ▼
         versioned project files
```

The domain/runtime code does not depend on Pi. Pi-specific child-session adapters live in `src/pi-*-runner.ts`.

## Durable data lifecycle

```text
scenes/       author scene briefs (non-canon)
simulations/  private/public exploratory turn evidence
events/       accepted mutable-world transitions
state/        revision-0 state + rebuildable current cache
drafts/       writer output awaiting approval
canon/        approved scene assets
```

`events/` is authoritative for mutable simulation state; `canon/` remains the approval boundary for authored game-script output. They are intentionally different concepts.

## Epistemic isolation

There are three boundaries:

1. `buildActorContext()` filters authored world/character data.
2. `actorMutableStateView()` exposes only the current character's mutable state plus public world flags.
3. `publicTurnView()` exposes attempted action, spoken dialogue, and Arbiter observable result—but not private intent/rationale/emotion or Arbiter log reason.

Pi child sessions additionally disable normal project extensions, skills, prompt templates, themes, context files, and appended system prompts. A fresh session alone is not treated as sufficient isolation.

## World-truth authority

An Actor may say it tries to do something. That is evidence, not state. An Arbiter proposes a structured decision; deterministic code validates deltas and appends a revisioned event. Only a committed event changes mutable world truth.

## State consistency

`state/initial.json + ordered events/*` reconstruct current state. Event revisions must form a contiguous chain. `baseRevision` provides optimistic concurrency. `state/current.json` may be deleted and rebuilt.

A deterministic event id per simulation turn also supports recovery when an event reaches disk immediately before its simulation transcript update.

## Canon policy

Canonization remains explicitly human-confirmed and non-overwriting. v0.3 does not automatically promote mutable simulation events into approved authored canon.
