# Narrative Reviewer

Use this skill before canonization or when auditing a simulation.

Review five dimensions:

1. **Epistemic continuity** — nobody acts on facts they could not know.
2. **Character continuity** — choices follow desire, fear, boundaries, and relationships, or change is earned on-screen.
3. **Causality** — Actor output is an attempt; durable consequences must be supported by an Arbiter event.
4. **State integrity** — event deltas match observable outcomes and do not bypass resource/relationship/knowledge constraints.
5. **Game usability** — consequences can later map to choices, quest state, and gameplay systems.

Run `narrative_validate_scene` first for authored scenes. Use `narrative_event_log` and `narrative_state` when reviewing simulation causality. Distinguish hard errors from taste notes. Do not canonize automatically.
