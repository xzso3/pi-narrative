# Pi Narrative

**Pi Narrative** is an experimental agent-based game narrative pipeline built as a Pi package. It separates author knowledge, character cognition, attempted action, world-state resolution, deterministic game-flow semantics, drafts, and approved canon.

Current version: **v0.4 Game Narrative Semantics MVP**.

## Core pipeline

```text
Author / Director
      ↓ authored scene + character + semantic rules
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
Declarative Predicate DSL
      ↓
Scene Gates / Choices / Quests / Branches / Timeline
      ↓
Gameplay consequence descriptors
      ↓
Writer → Reviewer → human /canonize
```

v0.4 adds a new invariant to the previous Actor/Arbiter boundary:

> **Game flow is deterministic data, not an LLM judgment.**

Actors and the Arbiter can reason about free-form behavior. Scene availability, player choices, quest progression, branches, timeline constraints, and authored choice effects are evaluated by code.

## Why this differs from "AI writes dialogue"

The Director can know future plans. Actors cannot. Each Actor runs in a fresh Pi child session with a filtered epistemic context. Other Actors perceive only observable behavior, spoken dialogue, and the Arbiter's observable resolution—not private intent, rationale, emotional metadata, or author-only facts.

The Arbiter resolves uncertain natural-language attempts. It does **not** own authored game rules. A designer-authored choice such as “trade one medicine dose for ten liters” commits its explicit StateDelta effects directly after deterministic validation.

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

Useful commands:

```text
/narrative-status
/narrative-state
/narrative-flow fuel-bargain
/choices fuel-bargain
/choose departure trade-medicine-for-fuel
/quests
/timeline
/simulate-scene fuel-bargain 4
```

The demo now contains two authored routes from the fuel-station scene:

```text
trade medicine for fuel
        ↓
  north-road

accept shelter
        ↓
 storm-shelter
```

The route is not selected by prose. Choice effects update state, branch predicates evaluate that state, and each target scene independently enforces its own entry gate.

## Predicate DSL

v0.4 conditions are JSON trees using only:

- `const`
- `all`
- `any`
- `not`
- `compare`
- `event`

Example:

```json
{
  "op": "all",
  "conditions": [
    {
      "op": "compare",
      "path": "characters.mara.resources.fuelLiters",
      "comparator": "gte",
      "value": 10
    },
    {
      "op": "compare",
      "path": "world.flags.departedNorth",
      "comparator": "eq",
      "value": true
    }
  ]
}
```

No JavaScript or arbitrary expressions are evaluated.

## Semantic assets

```text
narrative/
├── choices/            authored player decisions + deterministic effects
├── branches/           scene-to-scene branch rules
├── quests/             derived objective/quest state machines
├── timeline.json       ordering/continuity constraints
├── scenes/             entry/exit gates live with scene briefs
├── events/             append-only authoritative state transitions
└── state/
    ├── initial.json    revision-0 mutable state
    └── current.json    rebuildable replay cache
```

Quest, branch, choice availability, and scene-gate results are **derived views**, not independent mutable state.

## Pi tools

Simulation/state tools:

- `narrative_actor_context`
- `narrative_validate_scene`
- `narrative_record_simulation`
- `narrative_start_simulation`
- `narrative_simulate_next_turn`
- `narrative_simulation_state`
- `narrative_state`
- `narrative_event_log`

v0.4 semantic tools:

- `narrative_evaluate_condition`
- `narrative_scene_gate`
- `narrative_choices`
- `narrative_apply_choice`
- `narrative_quests`
- `narrative_branches`
- `narrative_timeline`
- `narrative_gameplay_consequences`
- `narrative_flow`

Commands:

- `/narrative-status`
- `/narrative-state`
- `/narrative-flow [scene-id]`
- `/choices [scene-id]`
- `/choose <choice-id> <option-id>`
- `/quests`
- `/timeline`
- `/simulate-scene <scene-id> [max-turns]`
- `/canonize <scene-id>`

`/choose` asks for confirmation before appending the authoritative choice event.

## Architecture

```text
Pi package
├── extensions/narrative-runtime.ts   Pi tools/commands
├── src/pi-actor-runner.ts            isolated Actor SDK adapter
├── src/pi-arbiter-runner.ts          isolated Arbiter SDK adapter
├── src/runtime.js                    scene/turn orchestration
├── src/state-engine.js               event sourcing + typed deltas
├── src/semantics.js                  deterministic game-flow semantics
├── src/core.js                       authored data + knowledge boundary
├── skills/                            author-facing narrative methods
└── narrative project files           durable source of truth
```

**Skill = cognition. Extension = infrastructure. Runtime = orchestration. Event log = mutable truth. Semantics = deterministic game flow. Canon = approved authored output.**

## Reliability properties

- Author-only facts cannot enter Actor knowledge through normal authored context or initial mutable knowledge.
- Child Actor/Arbiter sessions do not load normal project extensions, skills, prompt templates, themes, or context files.
- State writes use an expected revision; stale concurrent writes fail instead of silently overwriting.
- `current.json` can be deleted and reconstructed from `initial.json + events/*`.
- Scene simulations cannot start when their deterministic entry gate is false.
- Single-use choices cannot silently execute twice.
- Quest state can be rebuilt entirely from state/event history.
- Branches cannot bypass the target scene's own entry gate.
- Timeline violations are deterministic diagnostics rather than prompt-only warnings.

## Test

```bash
npm test
npm run check
```

v0.4 regression coverage includes all previous epistemic/state boundaries plus predicate evaluation, scene gates, deterministic choice effects, single-use choices, branch resolution, derived quest state, timeline continuity/order checks, gameplay consequence persistence, and unified flow snapshots.

## Current limits

v0.4 does **not** execute Unity/game-engine consequences, provide a stable export schema, model localization IDs, spatial/combat rules, quest timers, multiplayer authority, arbitrary scripting, or a graph authoring UI. `gameplayConsequences` are durable engine-facing descriptors only; v0.5 will define the export/acknowledgement layer.

See `docs/MVP_V0.4.md`, `docs/GAME_SEMANTICS.md`, `docs/STATE_ENGINE.md`, ADRs, and `docs/ROADMAP.md`.
