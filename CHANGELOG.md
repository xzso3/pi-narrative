# Changelog

## 0.2.0 - 2026-09-15

Actor Runtime MVP:
- Added persisted, resumable scene simulations with deterministic turn scheduling.
- Added structured ActorResponse validation.
- Added public/private transcript separation so mental state cannot leak between Actors.
- Added Pi SDK Actor runner using a fresh isolated child session per turn.
- Added `/simulate-scene` plus simulation start/next/state tools.
- Added replay/resume regression tests.
- Fixed v0.1 canonization test fixture creating the draft directory.

## 0.1.0 - 2026-09-14

First MVP proving the Pi Narrative architecture:
- Pi package manifest with one extension and four skills.
- Knowledge-isolated Actor Context builder.
- Scene validation.
- Structured roleplay simulation persistence.
- Human-confirmed, non-overwriting canonization command.
- Example narrative project and automated domain-core tests.
