# Validation Plan v0.5

Current complete repository regression result: **40/40 passing** in GitHub Actions for the v0.5 merge.

## Coverage

Knowledge/runtime: actor knowledge isolation, private mental-state isolation, scene-gate enforcement, crash recovery.

State Engine: illegal delta rejection, sequential compound-delta validation, replay, revision conflicts.

Game semantics: safe predicate DSL, deterministic choices, target-gated branches, derived quests, timeline constraints, strict event selectors, gameplay consequences.

Engine integration: Unity-friendly DTOs, deterministic `deliveryId`, redelivery until ACK, idempotent ACK, unknown ACK rejection, save snapshots, checkpoint tamper detection, schema migration, localization IDs, malformed consequence rejection.

## CI

```bash
npm run check
npm run validate:project -- examples/roadside-station
```

The v0.5 merge CI completed with 40 tests, 40 passing, 0 failing, and Roadside Station returned `valid: true`. Documentation maintenance additionally runs `npm run check:docs` through `npm run check`.

## Manual smoke test

1. clone + `pi install .`;
2. `/narrative-state`;
3. `/narrative-flow fuel-bargain`;
4. `/choose departure trade-medicine-for-fuel`;
5. `/quests` and `/timeline`;
6. `/engine-export unity`;
7. `/engine-ack unity <delivery-id>`;
8. `/engine-save unity slot1` and `/engine-checkpoint post-trade`;
9. `/engine-validate`.

Model-backed Actor/Arbiter smoke testing requires a live Pi model and `/simulate-scene fuel-bargain 4`.
