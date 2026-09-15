# Architecture v0.5

## Layering

```text
Pi authoring session
 ├─ Skills: Director / Writer / Reviewer / Arbiter / Game Semantics / Engine Integration
 ├─ narrative-runtime extension
 └─ engine-integration extension
          │
          ▼
Harness-independent domain/runtime
 ├─ core.js                authored data + epistemic filtering
 ├─ runtime.js             scene turn orchestration
 ├─ state-engine.js        event sourcing + deterministic mutation rules
 ├─ semantics.js           conditions / choices / quests / branches / timeline
 └─ engine-integration.js  export / ACK / save / checkpoint / migration
          │
          ├──────────────┐
          ▼              ▼
 isolated Actor      isolated Arbiter
 Pi child session    Pi child session
          │              │
          └──────┬───────┘
                 ▼
         versioned project files
                 │
                 ▼
          EngineExport DTO
                 │
                 ▼
           Unity / runtime
```

The domain/runtime/semantic/engine-export logic does not depend on Pi sessions. Pi-specific adapters remain in `src/pi-*-runner.ts`; Pi-facing tools/commands remain in `extensions/`.

## Authority boundaries

1. **Actor** — proposes character behavior from filtered knowledge.
2. **Arbiter** — resolves uncertain free-form Actor attempts into candidate deltas.
3. **Authored semantic rules** — deterministic designer-owned logic such as choice effects and scene gates.
4. **Engine consumer** — executes exported gameplay consequences but does not rewrite narrative truth by ACKing them.

Engine ACK state is integration state, not story state.

## Durable data lifecycle

`scenes/`, `choices/`, `branches/`, `quests/`, `timeline.json`, `simulations/`, `events/`, `state/`, `drafts/`, and `canon/` hold narrative authoring/runtime data. `runtime/<consumer>/acks.json`, `exports/`, save exports, and `checkpoints/` are derived integration artifacts.

Quest status, available choices, scene gates, and branch targets are derived from replayed state + event history and are never a second mutable source of truth.

## Simulation safety

Scene entry gates are checked before simulation creation and during branch resolution. Actor actions remain attempts until Arbiter resolution + deterministic validation.

## Engine delivery safety

Gameplay consequences have stable `deliveryId` values. Delivery is at-least-once; consumers must deduplicate before side effects and ACK after safe handling.

## Canon policy

Canonization is human-confirmed and non-overwriting. Simulation events, derived game-flow state, and engine ACK state do not automatically become approved canon.
