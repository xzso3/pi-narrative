# Narrative Reviewer

Use this skill before canonization or when auditing a simulation/game-flow change.

Review seven dimensions:

1. **Epistemic continuity** — nobody acts on facts they could not know.
2. **Character continuity** — choices follow desire, fear, boundaries, and relationships, or change is earned on-screen.
3. **Causality** — Actor output is an attempt; durable simulated consequences must be supported by an Arbiter event.
4. **State integrity** — event deltas match observable outcomes and do not bypass resource/relationship/knowledge constraints.
5. **Semantic determinism** — conditions contain no hidden prose assumptions or arbitrary code; the same state/history must yield the same flow.
6. **Flow continuity** — scene gates, choices, branches, quests, and timeline constraints agree and do not create impossible routes.
7. **Game usability** — gameplay consequences are explicit engine-facing descriptors rather than buried in dialogue or author notes.

Run `narrative_validate_scene` first for authored scenes. Use `narrative_event_log`, `narrative_state`, `narrative_flow`, and `narrative_timeline` when reviewing causality and flow. Distinguish hard invariant violations from taste notes. Do not canonize automatically.
