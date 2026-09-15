# Contributing

Keep the domain core harness-independent. New Pi-facing behavior belongs under `extensions/` or `skills/`.

Any change to knowledge visibility, state authority, delivery semantics, or canon semantics requires regression tests and an ADR when it changes an architectural invariant.

## Documentation parity

User-facing documentation is bilingual:

- English remains at canonical existing paths.
- Simplified Chinese mirrors live under `docs/zh-CN/`, plus root `*.zh-CN.md` companions.
- Human-readable Skill translations live under `docs/zh-CN/skills/`; executable `skills/*/SKILL.md` files remain canonical Pi inputs.

When adding or renaming Markdown documentation, add/update the Chinese mirror in the same pull request. `npm run check:docs` and `npm run check` enforce translation-file coverage.

## Before opening a pull request

```bash
npm test
npm run check
npm run validate:project -- examples/roadside-station
```
