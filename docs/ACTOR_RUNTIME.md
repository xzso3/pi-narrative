# Actor Runtime v0.2

## Turn pipeline

```text
Persisted Simulation
      ↓ nextActorId()
Actor Context Builder
      ↓
+ observable prior turns only
      ↓
ActorTurnContext
      ↓
Pi child AgentSession
  - fresh session
  - Actor-only system prompt
  - no built-in tools
  - submit_actor_response tool only
      ↓
Structured ActorResponse
      ↓
validate + append
      ↓
Persist simulation
```

## Public vs private transcript

Public perception:
- turn number
- character id
- observable action
- dialogue spoken aloud

Private simulation evidence:
- intent
- rationale
- emotional shift

The Writer/Reviewer may inspect private evidence. Other Actors may not.

## Replay and resume

`narrative/simulations/<id>.json` contains the whole runtime state: turn order, max turns, status, and structured turns. No child Pi session is required to resume; the next child session is reconstructed from this file plus project state.
