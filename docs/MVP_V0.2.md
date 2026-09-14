# MVP v0.2 — Actor Runtime

Date: 2026-09-15

## Hypothesis

After v0.1 proved that narrative state and epistemic boundaries can be enforced outside prompts, v0.2 tests whether Pi can execute a scene as a sequence of **isolated Actor sessions** without leaking author knowledge or another character's private reasoning.

## Success criteria

1. A scene can start as a persisted, resumable simulation.
2. Turn order is deterministic and based on scene cast order.
3. Each Actor turn receives a freshly constructed knowledge-isolated context.
4. Previous turns expose only observable action and spoken dialogue to later Actors.
5. Actor output is structured (`intent`, `action`, optional `dialogue`, `rationale`, `emotionalShift`).
6. `intent`, `rationale`, and emotional state are private simulation evidence and never become another Actor's perception.
7. A Pi SDK child session can act as the Actor executor with built-in tools disabled and a terminating structured-response tool.
8. Simulation state survives process restart and can be replayed/resumed from disk.

## Deliberate limits

- Round-robin turn scheduling only; no Director-controlled dynamic initiative yet.
- No automatic world-state mutation from Actor claims.
- No relationship/knowledge delta application yet.
- No branching choices or quest state.
- Model routing policy is inherited from the parent Pi session; no per-character routing table yet.
- No parallel Actors: scenes are sequential because each action can change what later Actors perceive.

## Result

The domain runtime is harness-independent. `src/pi-actor-runner.ts` is the Pi adapter and creates a fresh in-memory Pi child session for each turn. That makes simulation replay reproducible from persisted public history rather than hidden child-session memory.
