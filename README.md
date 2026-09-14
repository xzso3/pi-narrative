# Pi Narrative

**Pi Narrative** is an experimental agent-based game narrative pipeline built as a Pi package. It treats characters as knowledge-bounded Actors and keeps simulation, drafts, and approved canon as separate project data.

Current version: **v0.2 Actor Runtime MVP**.

## Core idea

```text
World + Character + Scene state
            ↓
  knowledge-isolated context
            ↓
   fresh Pi Actor session
            ↓
 structured ActorResponse
            ↓
 observable action/dialogue ─────→ next Actor can perceive
 private intent/rationale/emotion ─X→ never leaks to next Actor
            ↓
 persisted simulation
            ↓
 Writer → Reviewer → human /canonize
```

## Why this differs from "AI writes dialogue"

The Director can know future plans. Actors cannot. Each Actor child session receives only a filtered `ActorTurnContext`; it is never told to merely "ignore" secrets already present in context. After a turn, other Actors perceive only observable behavior and spoken dialogue—not the previous Actor's chain of reasoning, intent, or emotional metadata.

## Install

```bash
pi install https://github.com/xzso3/pi-narrative
```

For local development:

```bash
pi install ./pi-narrative
```

## Demo

```bash
cd examples/roadside-station
pi
```

Then:

```text
/narrative-status
/simulate-scene fuel-bargain 6
```

The simulation is saved under `narrative/simulations/` and can be replayed/resumed from disk.

## Pi tools

- `narrative_actor_context`
- `narrative_validate_scene`
- `narrative_record_simulation`
- `narrative_start_simulation`
- `narrative_simulate_next_turn`
- `narrative_simulation_state`
- `narrative_status`

Commands:

- `/narrative-status`
- `/simulate-scene <scene-id> [max-turns]`
- `/canonize <scene-id>`

## Architecture

```text
Pi package
├── extensions/narrative-runtime.ts   Pi tools/commands
├── src/pi-actor-runner.ts            Pi SDK child-session adapter
├── src/runtime.js                    harness-independent scene runtime
├── src/core.js                       narrative data/knowledge boundary
├── skills/                            Director/Actor/Writer/Reviewer methods
└── narrative project files           durable source of truth
```

**Skill = cognition. Extension = infrastructure. Runtime = simulation control. Canon = project data.**

Actor child sessions are intentionally ephemeral in v0.2. Durable state lives in JSON so a simulation can resume after process restart and can later move to another harness/model.

## Test

```bash
npm test
npm run check
```

v0.2 regression coverage includes knowledge isolation, scene validation, canon gating, ActorResponse validation, turn order, mental-state privacy, and replay/resume.

## Current limits

v0.2 does not yet let Actor claims mutate world/canon state. It also has no quest graph, branching choice model, Unity export, GUI, or Director arbitration. Those begin in v0.3/v0.4.

See `docs/MVP_V0.2.md`, `docs/ACTOR_RUNTIME.md`, ADRs, and `docs/ROADMAP.md` for design rationale and next steps.
