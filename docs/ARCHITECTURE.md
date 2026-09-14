# Architecture v0.4

## Layering

```text
Pi authoring session
 ├─ Skills: Director / Writer / Reviewer / Arbiter / Game Semantics
 └─ Extension: commands and deterministic tool boundary
          │
          ▼
 Harness-independent domain/runtime
 ├─ core.js          authored data + epistemic filtering
 ├─ runtime.js       scene turn orchestration
 ├─ state-engine.js  event sourcing + deterministic mutation rules
 └─ semantics.js     conditions / choices / quests / branches / timeline
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

The domain/runtime/semantics code does not depend on Pi. Pi-specific child-session adapters remain confined to `src/pi-*-runner.ts`.

## Authority boundaries

There are three different authorities:

1. **Actor** — proposes character behavior from filtered knowledge.
2. **Arbiter** — resolves uncertain free-form Actor attempts into candidate deltas.
3. **Authored semantic rules** — deterministic designer-owned game logic such as player choice effects and scene gates.

The Arbiter does not override authored choice effects, and authored conditions do not call an LLM.

## Durable data lifecycle

```text
scenes/       authored scene briefs + entry/exit gates
choices/      authored decisions and explicit effects
branches/     deterministic scene routing rules
quests/       derived objective definitions
timeline.json continuity/order constraints
simulations/  private/public exploratory turn evidence
events/       accepted mutable-world + authored-choice transitions
state/        revision-0 state + rebuildable current cache
drafts/       writer output awaiting approval
canon/        approved scene assets
```

## Derived flow

Quest status, available choices, scene gates, and branch targets are computed from current replayed state + event history. They are never a second mutable source of truth.

```text
initial state + events
        ↓ replay
 current state
        ├─ predicates → choices
        ├─ predicates → quest/objective states
        ├─ predicates → scene gates
        ├─ predicates → branch targets
        └─ event order → timeline diagnostics
```

## Scene transition safety

`runtime.createSimulation()` evaluates the target scene's entry gate before creating a simulation. Branch resolution also checks that gate. Therefore neither a direct simulation request nor a branch rule can bypass scene eligibility.

## Choice authority

Designer-authored choice deltas are committed through the same StateDelta validator/event log as Arbiter changes, but no Arbiter LLM is involved. This preserves deterministic designer intent while retaining replay/revision guarantees.

## Canon policy

Canonization remains explicitly human-confirmed and non-overwriting. v0.4 game-flow state still does not automatically promote simulation output into approved script canon.
