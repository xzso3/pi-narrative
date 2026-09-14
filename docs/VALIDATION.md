# Validation plan v0.3

## Automated regression suite

The suite verifies:

- authored Actor context excludes another character's secret;
- authored Actor context excludes future author-only facts;
- mutable initial state cannot smuggle actor-invisible facts into character knowledge;
- scene validator rejects missing cast entities;
- canonization requires explicit promotion and refuses overwrite;
- ActorResponse requires intent/action;
- scheduler preserves cast order and replay/resume behavior;
- private Actor intent/rationale/emotion never enters another Actor's perceived history;
- StateDelta rejects negative resources, out-of-range relationships, and actor-invisible knowledge;
- rejected Arbiter actions cannot mutate state;
- event log replay reconstructs current state;
- stale base revisions fail;
- resolved turns expose attempted action + observable resolution, not private rationale;
- event-before-transcript interruption recovers without rerunning Actor/Arbiter.

## Pi SDK/API verification

v0.3 child-runner code was cross-checked against the current Pi SDK source/docs for:

- `createAgentSession`;
- `DefaultResourceLoader`;
- `noExtensions`, `noSkills`, `noPromptTemplates`, `noThemes`, `noContextFiles`;
- `systemPromptOverride` + empty appended system prompt;
- `noTools: "builtin"` with custom submit tools;
- `SessionManager.inMemory()`.

The execution environment used for this MVP could not resolve npm registry DNS, so a fresh dependency install/live model smoke test was not treated as passed. Pure runtime/package tests remain deterministic and do not require network/model credentials.

## Manual Pi smoke test

1. Install: `pi install https://github.com/xzso3/pi-narrative`.
2. `cd examples/roadside-station`.
3. Run `/narrative-state`; verify revision 0.
4. Run `/simulate-scene fuel-bargain 2`.
5. Inspect `narrative/events/` and `/narrative-state`.
6. Verify every simulation turn has an Arbiter resolution/event id.
7. Verify public replay excludes Actor intent/rationale/emotionalShift and Arbiter reason.
8. Delete `narrative/state/current.json`, rerun `/narrative-state`, and verify it rebuilds to the same revision/value.
