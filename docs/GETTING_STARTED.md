# Getting Started — Step-by-Step

## 1. Choose how you want to use Pi Narrative

Use as a Pi package:

```bash
pi install https://github.com/xzso3/pi-narrative
```

Run the repository demo:

```bash
git clone https://github.com/xzso3/pi-narrative.git
cd pi-narrative
pi install .
cd examples/roadside-station
pi
```

Repository development requires Node.js 22.19+.

## 2. Verify the deterministic layer

```text
/narrative-status
/narrative-state
/narrative-flow fuel-bargain
/choices fuel-bargain
```

## 3. Apply a player choice

```text
/choose departure trade-medicine-for-fuel
```

Then inspect `/narrative-state`, `/narrative-flow fuel-bargain`, `/quests`, and `/timeline`.

Reset the demo with:

```bash
git restore examples/roadside-station/narrative
```

## 4. Run a model-backed simulation

```text
/simulate-scene fuel-bargain 4
```

Actor proposes behavior; Arbiter resolves uncertain consequences; deterministic code validates and commits StateDelta records.

## 5. Export to Unity/game runtime

```text
/engine-export unity
```

Inspect `narrative/exports/unity/latest.json`.

## 6. Apply and ACK consequences

The consumer must deduplicate locally by `deliveryId`. After successful application:

```text
/engine-ack unity <delivery-id>
```

Unacknowledged effects remain eligible for redelivery.

## 7. Save and checkpoint

```text
/engine-save unity slot1
/engine-checkpoint chapter-1-end
```

## 8. Validate

```text
/engine-validate
```

Repository/CI form:

```bash
npm test
npm run check
npm run validate:project -- examples/roadside-station
```

## 9. Create your own project

Replace data in this order: `project.json`, `world.json`, `characters/*.json`, `state/initial.json`, `scenes/*.json`, `choices/*.json`, `branches/*.json`, `quests/*.json`, `timeline.json`.

Keep `events/` append-only through runtime operations rather than hand-authoring historical transitions.
