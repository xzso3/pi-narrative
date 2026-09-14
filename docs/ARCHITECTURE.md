# Architecture v0.1

## Boundary

```text
Pi
 ├─ Skills: narrative reasoning roles
 └─ Extension: deterministic tools and commands
          │
          ▼
   Narrative Domain Core
          │
          ▼
   Versioned project files
```

The domain core has no dependency on Pi. The Pi extension imports it as an adapter.

## Data lifecycle

```text
scenes/       author scene briefs (non-canon)
simulations/  exploratory Actor behavior (non-canon)
drafts/       writer output awaiting approval
canon/        approved immutable-in-v0.1 scene assets
```

## Epistemic isolation

`buildActorContext(characterId, sceneId)` is the trust boundary. It creates a new object rather than returning the original Character/World records. It includes only:

- character identity and private self-knowledge;
- the character's declared known world facts;
- public scene facts/events;
- immediate scene goal;
- current relationships/state.

Facts with `actorVisible: false` are filtered even if accidentally referenced by a character knowledge list. This is a defense-in-depth check against author-only future facts.

## Canon policy

v0.1 canon is deliberately append-only at the scene-file level. `canonizeDraft` refuses overwrite. Revision semantics will be designed only after real use reveals whether canon needs amendments, superseding revisions, or event sourcing.
