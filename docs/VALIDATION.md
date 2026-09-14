# Validation plan v0.4

Current deterministic regression result: **28/28 passing**.

## Automated regression suite

The suite covers all previous epistemic/runtime/state invariants plus v0.4 game semantics.

Previous boundaries retained:

- Actor context excludes another character's secret and author-only future facts.
- Mutable initial state cannot smuggle actor-invisible knowledge.
- Private Actor intent/rationale/emotion does not enter another Actor's perception.
- StateDelta rejects illegal resource/relationship/knowledge mutations.
- Arbiter rejection cannot mutate state.
- Event log replay reconstructs current state.
- Stale base revisions fail.
- Event-before-transcript interruption recovers without rerunning Actor/Arbiter.

v0.4 semantic coverage:

- Predicate DSL evaluates state without arbitrary expressions.
- Locked scene entry prevents simulation creation.
- Authored choice effects commit deterministically and change state once.
- Single-use choices reject a second selection.
- Alternative choice routes produce different branches without cross-contamination.
- Branch resolution also checks target scene entry gates.
- Quest objectives derive `locked/active/completed/failed` states from predicates and dependencies.
- `condition-requires` timeline constraints detect continuity violations.
- `event-before` constraints use durable event order.
- Event-selector predicates query semantic history.
- Choice writes still obey expected revision checks and StateDelta validation.
- Gameplay consequence descriptors persist on events.
- Unified flow snapshots combine gates, choices, quests, branches, timeline, and gameplay outputs.

## Pi extension/API verification

The extension continues to use current Pi SDK patterns for registered tools/commands and isolated Actor/Arbiter sessions. v0.4 adds deterministic semantic tools; these do not spawn additional LLM sessions.

Child sessions still explicitly disable normal project extensions, skills, prompt templates, themes, context files, and appended system prompts, exposing only the structured submit tool required by that child role.

## Manual Pi smoke test

1. Install: `pi install https://github.com/xzso3/pi-narrative`.
2. `cd examples/roadside-station`.
3. Run `/narrative-state`; verify revision 0.
4. Run `/narrative-flow fuel-bargain`; verify `departure` is available and no branch is yet active.
5. Run `/choose departure trade-medicine-for-fuel` and approve the confirmation.
6. Verify revision 1, Mara has 12L fuel, medicine is 0, and `north-road` is the available branch.
7. Run `/quests`; verify `survive-mile-83` is completed.
8. Run `/timeline`; verify the `fuel-before-north` constraint is satisfied.
9. Run `/narrative-flow north-road`; verify the scene entry gate is true.
10. In a fresh fixture, choose `accept-shelter`; verify only `storm-shelter` unlocks and Mara retains medicine/fuel.

## Environment caveat

If the execution environment cannot reach the npm registry or lacks model credentials, pure Node regression/package validation can still run deterministically. A fresh dependency install/live model call must not be reported as passing unless it actually executes.
