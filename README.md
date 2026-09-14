# Pi Narrative

**Pi Narrative** is an experimental game-narrative production pipeline built as a package for the Pi coding agent. The v0.1 MVP focuses on one proposition: believable AI-assisted game writing needs **structured state and enforced character knowledge boundaries**, not only better prompts.

## MVP loop

```text
Structured narrative data
        ↓
Actor Context Builder  ← hard knowledge isolation
        ↓
Roleplay exploration
        ↓
Simulation transcript (non-canon)
        ↓
Scene Writer draft
        ↓
Continuity / character review
        ↓
Human /canonize approval
        ↓
Canon (v0.1 never overwrites existing canon)
```

## What v0.1 proves

1. Pi can distribute Narrative runtime code and writing methods together as one package.
2. Actor-visible context is constructed by code, filtering author-only/future information.
3. Roleplay simulations are persisted separately from drafts and canon.
4. Scene assets can be validated before promotion.
5. Canonization is an explicit human-approved operation, not an automatic model decision.

## Install in Pi

From a local checkout:

```bash
pi install ./pi-narrative
```

Once this repository is public:

```bash
pi install https://github.com/<owner>/pi-narrative
```

Pi package installation and convention directories are documented by Pi upstream. Pi discovers `extensions/` and `skills/` resources from packages.

## Try the demo

The included demo lives under `examples/roadside-station`. Run Pi from that directory with this package installed.

Useful operations:

```text
/narrative-status
```

Ask Pi to use the `roleplay-actor` skill for Mara in `fuel-bargain`. It should call `narrative_actor_context` first. The returned context includes the bridge rumor but deliberately excludes both Oren's hidden fuel reserve and an author-only future fact.

The extension exposes:

- `narrative_actor_context`
- `narrative_validate_scene`
- `narrative_record_simulation`
- `narrative_status`
- `/narrative-status`
- `/canonize <scene-id>`

`/canonize` validates a draft, prompts the human, then creates `narrative/canon/<scene-id>.json`. v0.1 refuses to overwrite existing canon.

## Test

```bash
npm test
npm run check
```

The core tests require only Node.js. Pi itself is a peer dependency because this repository is intended to be loaded by Pi rather than ship its own copy of the harness.

## Repository map

```text
extensions/                 Pi runtime adapter
src/core.js                 harness-independent narrative domain core
skills/                     Director / Actor / Writer / Reviewer methods
examples/roadside-station/  runnable example narrative project
docs/research/              research notes and upstream evidence
docs/decisions/             architecture decision records
docs/                       MVP scope, architecture, implementation log, roadmap
test/                       domain-core regression tests
```

## Deliberate non-goals for v0.1

- Multi-agent orchestration / child Pi sessions
- Automatic turn-taking scene simulator
- LLM provider/model routing
- Vector database or graph database
- Full story-bible schema
- Quest/branch graph editor
- Unity integration/export
- GUI
- Automatic canon changes

These are deferred until the state model and authoring loop prove useful in real game-writing work.

## Design principle

**Skill = cognition. Extension = infrastructure. Canon = project data.**

The project deliberately keeps narrative domain data independent from Pi sessions so that story assets survive model, harness, and UI changes.

See `docs/` for the research trail, MVP definition, architecture, decisions, implementation log, validation results, and next-round plan.
