# Pi Narrative

> Agent-based game narrative middleware for Pi: isolated character simulation, event-sourced world state, deterministic game semantics, and a Unity-friendly engine boundary.

[简体中文](README.zh-CN.md) · [Documentation](docs/README.md) · [中文文档](docs/zh-CN/README.md) · [Roadmap](docs/ROADMAP.md)

**Current version: v0.5 — Engine Integration / Export Layer MVP**

Pi Narrative started as an experiment in using roleplay agents for game writing. It has evolved into a small narrative runtime with explicit authority boundaries:

```text
Author / Director
      ↓ authored world, characters, scenes, rules
Knowledge filtering
      ↓
Isolated Actor session
      ↓ attempted action
Isolated Arbiter session
      ↓ validated StateDelta
Append-only NarrativeEvent log
      ↓ deterministic replay
Mutable Narrative State
      ↓ declarative predicates
Choices / Quests / Branches / Scene Gates / Timeline
      ↓ GameplayConsequence
Engine export + stable deliveryId + ACK
      ↓
Unity / game runtime
```

> **LLMs may propose or resolve uncertain character behavior, but game rules and durable state transitions are validated by deterministic code.**

## What Pi Narrative gives you

- **Character knowledge isolation** — Actors do not receive author-only future facts or another character's private mental state.
- **Actor / Arbiter separation** — an Actor can attempt an action; only the Arbiter + State Engine can make an uncertain simulated action become world truth.
- **Event-sourced world state** — `state/initial.json + events/*` is the mutable narrative source of truth.
- **Deterministic game semantics** — scene gates, choices, branches, quests, and timeline constraints are JSON data, not LLM judgments.
- **Human-gated canon** — simulations and drafts are not automatically promoted to approved story canon.
- **Game-engine boundary** — Unity-friendly DTOs, stable gameplay consequence IDs, ACK ledgers, save snapshots, checkpoints, localization IDs, and project validation.
- **Regression coverage** — repository CI runs the complete v0.1–v0.5 test suite.

## What it is not

Pi Narrative is not a one-prompt story generator, a complete visual narrative editor, or a Unity plugin yet. v0.5 provides the deterministic middleware and file/DTO boundary; transport adapters and an authoring GUI are roadmap items.

---

# Quick Start

## Prerequisites

For using the package with Pi:

- a working Pi installation;
- at least one model/provider configured in Pi if you want Actor/Arbiter simulation.

For cloning, testing, and developing this repository:

- Git;
- Node.js **22.19+**.

## Path A — Install the Pi package only

```bash
pi install https://github.com/xzso3/pi-narrative
```

Then start Pi from your project directory.

> Installing the Pi package does **not** copy this repository's `examples/` directory into your current project. Use Path B if you want to run the included demo.

## Path B — Clone the repository and run the demo

```bash
git clone https://github.com/xzso3/pi-narrative.git
cd pi-narrative
pi install .
cd examples/roadside-station
pi
```

Inside Pi, start with:

```text
/narrative-status
/narrative-state
/narrative-flow fuel-bargain
/choices fuel-bargain
```

---

# Step-by-Step Tutorial

The Roadside Station demo can be explored in two modes. The deterministic path below does not need an LLM call; the simulation path does.

## Step 1 — Inspect the initial narrative state

```text
/narrative-state
/narrative-flow fuel-bargain
```

State is reconstructed from `narrative/state/initial.json + narrative/events/*.json`. `state/current.json` is only a rebuildable cache.

## Step 2 — Inspect player choices

```text
/choices fuel-bargain
```

The demo exposes:

```text
departure / trade-medicine-for-fuel
departure / accept-shelter
```

## Step 3 — Apply a deterministic choice

```text
/choose departure trade-medicine-for-fuel
```

After confirmation, inspect:

```text
/narrative-state
/narrative-flow fuel-bargain
/quests
/timeline
```

To try the other branch from a clean fixture:

```bash
git restore examples/roadside-station/narrative
```

then:

```text
/choose departure accept-shelter
```

## Step 4 — Run an Actor / Arbiter simulation

This step requires a working model in Pi:

```text
/simulate-scene fuel-bargain 4
```

For each turn:

```text
ActorTurnContext
      ↓
fresh isolated Actor child session
      ↓ structured ActorResponse
attempted action
      ↓
fresh isolated Arbiter child session
      ↓ structured ArbiterDecision
validated StateDelta
      ↓
NarrativeEvent
```

The Actor does not receive author-only future facts; private intent/rationale/emotion does not leak to the next Actor; and Actor actions remain attempts until Arbiter resolution + deterministic validation.

## Step 5 — Export to a game engine

After a choice or event has produced `gameplayConsequences`:

```text
/engine-export unity
```

Inspect `narrative/exports/unity/latest.json`. The export contains a versioned protocol/schema, event cursor, Unity-friendly state DTOs, pending consequences, localization IDs, and a deterministic `snapshotId`.

Each consequence receives a stable ID similar to:

```text
pn-1-choice-departure-trade-medicine-for-fuel-0
```

## Step 6 — Consume and ACK safely

Delivery is **at-least-once**. The game runtime must deduplicate locally by `deliveryId` before applying side effects. After safe application:

```text
/engine-ack unity <delivery-id>
```

ACK is idempotent. Until ACKed, a consequence remains eligible for redelivery.

## Step 7 — Save and checkpoint

```text
/engine-save unity slot1
/engine-checkpoint chapter-1-end
```

Save snapshots carry state/cursor/ACK data. Checkpoints protect an event-log prefix and replayed state against accidental historical mutation.

## Step 8 — Validate

```text
/engine-validate
```

Repository form:

```bash
npm test
npm run check
npm run validate:project -- examples/roadside-station
```

## Step 9 — Start your own project

Copy the example and replace data in this order:

1. `narrative/project.json`
2. `narrative/world.json`
3. `narrative/characters/*.json`
4. `narrative/state/initial.json`
5. `narrative/scenes/*.json`
6. `narrative/choices/*.json`
7. `narrative/branches/*.json`
8. `narrative/quests/*.json`
9. `narrative/timeline.json`

Run `/engine-validate` frequently while authoring.

A longer tutorial is available at [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md).

---

# Project Data Model

```text
narrative/
├── project.json
├── world.json
├── characters/
├── scenes/
├── choices/
├── branches/
├── quests/
├── timeline.json
├── state/
│   ├── initial.json      # authoritative revision-0 state
│   └── current.json      # rebuildable cache
├── events/               # append-only authoritative state transitions
├── simulations/          # exploratory simulation records
├── drafts/               # writer output awaiting approval
├── canon/                # human-approved authored canon
├── runtime/<consumer>/   # derived ACK state
├── exports/              # derived engine/save exports
└── checkpoints/          # derived integrity checkpoints
```

Authority hierarchy:

```text
Authored definitions          → rules/input
initial.json + events/*       → mutable narrative truth
current.json                  → replay cache
quest/branch/choice results   → derived semantic views
ACK/export/save/checkpoint    → derived integration state
canon/*                       → human-approved authored output
```

---

# Command Reference

## Narrative state & simulation

```text
/narrative-status
/narrative-state
/simulate-scene <scene-id> [max-turns]
/canonize <scene-id>
```

## Game semantics

```text
/narrative-flow [scene-id]
/choices [scene-id]
/choose <choice-id> <option-id>
/quests
/timeline
```

## Engine integration

```text
/engine-export [consumer-id]
/engine-ack <consumer-id> <delivery-id> [delivery-id...]
/engine-save [consumer-id] [slot-id]
/engine-checkpoint [label]
/engine-validate
/engine-migrate
```

---

# Architecture at a Glance

```text
Pi package
├── extensions/narrative-runtime.ts   authoring/simulation/semantic tools
├── extensions/engine-integration.ts  export/ACK/save/checkpoint tools
├── src/core.js                       authored data + knowledge boundary
├── src/runtime.js                    scene/turn orchestration
├── src/state-engine.js               event sourcing + deterministic deltas
├── src/semantics.js                  choices/quests/branches/predicates
├── src/engine-integration.js         Unity DTO/export/ACK/save/checkpoint
├── src/pi-actor-runner.ts            isolated Actor child-session adapter
├── src/pi-arbiter-runner.ts          isolated Arbiter child-session adapter
└── skills/                            author-facing narrative methods
```

Detailed docs: [Architecture](docs/ARCHITECTURE.md), [Domain Model](docs/DOMAIN_MODEL.md), [Actor Runtime](docs/ACTOR_RUNTIME.md), [State Engine](docs/STATE_ENGINE.md), [Game Semantics](docs/GAME_SEMANTICS.md), [Engine Integration](docs/ENGINE_INTEGRATION.md).

## Core reliability invariants

- Author-only facts are not sent to Actors.
- Private Actor mental state is not exposed to other Actors.
- Actor actions are attempts; uncertain world truth belongs to Arbiter + deterministic validation.
- Authored game rules do not require an LLM judgment.
- Event revisions are contiguous and stale writes are rejected.
- Scene entry gates cannot be bypassed by simulation creation or branch routing.
- Quest/branch/choice state is derived from state + event history.
- Engine ACK state is not narrative truth.
- Unacknowledged consequences remain eligible for redelivery.
- Consumers must deduplicate side effects using stable `deliveryId` values.

# Documentation Languages

English remains at canonical existing paths. Simplified Chinese mirrors are available in parallel:

- [中文 README](README.zh-CN.md)
- [中文文档索引](docs/zh-CN/README.md)
- every `docs/*.md` has a corresponding file under `docs/zh-CN/`;
- ADRs mirror under `docs/zh-CN/decisions/`;
- research mirrors under `docs/zh-CN/research/`;
- human-readable Skill translations mirror under `docs/zh-CN/skills/` while executable `SKILL.md` files remain unchanged.

`npm run check:docs` enforces translation-file coverage.

# Development

```bash
npm test
npm run check
npm run validate:project -- examples/roadside-station
```

See [CONTRIBUTING.md](CONTRIBUTING.md), [CHANGELOG.md](CHANGELOG.md), and [ROADMAP.md](docs/ROADMAP.md).

## License

MIT. See [LICENSE](LICENSE).
