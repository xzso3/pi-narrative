# Domain model v0.1

This schema is intentionally small and JSON-based.

## Project

- `schemaVersion`
- `id`
- `title`
- `sceneOrder[]`

## WorldFact

- `id`
- `text`
- `actorVisible` — hard filter for author-only information

## Character

- identity
- desire
- fear
- boundaries
- speech
- currentState
- relationships
- knowledge.factIds
- knowledge.privateFacts

## Scene

- id/title/location/situation
- cast[]
- publicFactIds[]
- publicEvents[]
- actorGoals{characterId: goal}
- outcome.stateChanges[]

## Simulation

A non-canon record of roleplay turns. Each turn captures `characterId`, `intent`, `action`, and optional `dialogue`.

## Draft

Uses the Scene shape in v0.1 to keep promotion simple. Later versions may separate authored script beats, game choices, conditions, and localization keys.

## Canon

A validated draft plus `canon.status`, `approvedBy`, and `approvedAt`.
