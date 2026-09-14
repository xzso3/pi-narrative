# ADR-004: Actor child sessions are ephemeral; simulation state is durable

Status: Accepted

Each Actor turn gets a fresh Pi SDK session whose system prompt contains only the filtered ActorTurnContext. The session is disposed after it submits a structured ActorResponse.

Why:
- prevents cross-character context contamination;
- keeps replay/resume independent from hidden model-session state;
- makes the persisted transcript the inspectable source of simulation history;
- allows future model routing per turn/character.

Trade-off: repeated system context costs more tokens than long-lived Actor sessions. We accept that cost in v0.2 in exchange for stronger isolation and reproducibility.
