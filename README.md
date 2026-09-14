# Pi Narrative

**Pi Narrative** is an experimental agent-based game narrative pipeline built as a Pi package. It separates author knowledge, character cognition, attempted action, world-state resolution, drafts, and approved canon.

Current version: **v0.3 Narrative State Engine MVP**.

## Core pipeline

```text
Author / Director
      ↓ scene + character + authored world
Knowledge filter
      ↓
Ephemeral Actor child session
      ↓ structured ActorResponse
 attempted action + dialogue
      ↓
Ephemeral Arbiter child session
      ↓ structured ArbiterDecision
 deterministic validation
      ↓
NarrativeEvent append-only log
      ↓ replay
Mutable Narrative State
      ↓
next Actor perception
      ↓
Writer → Reviewer → human /canonize
```

Two rules define v0.3:

1. **An Actor action is an attempt, not truth.** Only a validated Arbiter event can mutate world state.
2. **The event log is the mutable-state source of truth.** `state/current.json` is a rebuildable cache.

## Why this differs from "AI writes dialogue"

The Director can know future plans. Actors cannot. Each Actor runs in a fresh Pi child session with a filtered epistemic context. Other Actors perceive only observable behavior, spoken dialogue, and the Arbiter's observable resolution—not private intent, rationale, emotional metadata, or author-only facts.

The Arbiter is also isolated from normal project tools, skills, extensions, and context files. It receives the attempted action, public scene conditions, and current mutable state, then proposes typed deltas. Deterministic code decides whether those deltas are legal.

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
/narrative-state
/simulate-scene fuel-bargain 6
```

A run creates:

```text
narrative/
├── simulations/        private + public turn records
├── events/             append-only world-state events
└── state/
    ├── initial.json    revision-0 mutable state
    └── current.json    rebuildable replay cache
```

## StateDelta types

v0.3 deliberately supports a small mutation vocabulary:

- `resource` — numeric character-owned resources; never below zero.
- `relationship` — numeric metrics constrained to `[-1, 1]`.
- `knowledge` — add an existing actor-visible world fact to a character.
- `state` — set/increment character attributes or public world flags.

Every accepted/partial Arbiter decision becomes one revisioned `NarrativeEvent`. Replaying `initial.json + events/*` deterministically reconstructs current state.

## Pi tools

- `narrative_actor_context`
- `narrative_validate_scene`
- `narrative_record_simulation`
- `narrative_start_simulation`
- `narrative_simulate_next_turn`
- `narrative_simulation_state`
- `narrative_state`
- `narrative_event_log`
- `narrative_status`

Commands:

- `/narrative-status`
- `/narrative-state`
- `/simulate-scene <scene-id> [max-turns]`
- `/canonize <scene-id>`

## Architecture

```text
Pi package
├── extensions/narrative-runtime.ts   Pi tools/commands
├── src/pi-actor-runner.ts            isolated Actor SDK adapter
├── src/pi-arbiter-runner.ts          isolated Arbiter SDK adapter
├── src/runtime.js                    scene/turn orchestration
├── src/state-engine.js               event sourcing + typed deltas
├── src/core.js                       authored data + knowledge boundary
├── skills/                            author-facing narrative methods
└── narrative project files           durable source of truth
```

**Skill = cognition. Extension = infrastructure. Runtime = orchestration. Event log = mutable truth. Canon = approved authored output.**

## Reliability properties

- Author-only facts cannot enter Actor knowledge through normal authored context or initial mutable knowledge.
- Child Actor/Arbiter sessions do not load project extensions, skills, prompt templates, themes, or context files.
- State writes use an expected revision; stale concurrent writes fail instead of silently overwriting.
- An event committed immediately before a crash can recover its simulation turn without rerunning the LLM or applying the delta twice.
- `current.json` can be deleted and reconstructed from `initial.json + events/*`.

## Test

```bash
npm test
npm run check
```

v0.3 regression coverage includes all v0.1/v0.2 boundaries plus StateDelta validation, initial-state validation, event replay, non-negative resource constraints, revision conflicts, Arbiter resolution semantics, and crash recovery.

## Current limits

v0.3 does **not** yet model quest/choice graphs, temporal ordering, generalized predicates, inventory item identity, spatial simulation, combat rules, branch conditions, localization, Unity export, or a GUI. The Arbiter is an LLM resolver constrained by deterministic schemas; it is not a full rules engine.

See `docs/MVP_V0.3.md`, `docs/STATE_ENGINE.md`, ADRs, and `docs/ROADMAP.md`.
