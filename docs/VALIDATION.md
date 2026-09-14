# Validation plan

## Automated

- Actor context excludes another character's secret.
- Actor context excludes a future author-only fact even when mistakenly listed in character knowledge.
- Scene validator rejects missing cast entities.
- Canonization adds approval metadata.
- Canonization refuses overwrite.
- Package structure contains Pi extension and skill resources.

## Manual Pi smoke test

1. Install current directory with `pi install ./pi-narrative` (or load with `pi -e ...`).
2. `cd examples/roadside-station`.
3. Start Pi.
4. Run `/narrative-status`.
5. Ask for Mara's Actor context in `fuel-bargain`.
6. Confirm `underground-reserve` and `mara-dies-later` are absent.
7. Ask the Actor skill to simulate a response.
8. Ask Writer skill to create `narrative/drafts/fuel-bargain.json`.
9. Run `/canonize fuel-bargain`; reject once, then approve.
10. Confirm canon exists only after approval.
