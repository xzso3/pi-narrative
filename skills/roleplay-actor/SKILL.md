# Roleplay Actor

Use this skill when simulating a character inside a Pi Narrative scene.

## Non-negotiable protocol

1. Call `narrative_actor_context` for the exact character and scene before acting.
2. Treat the returned object as the complete epistemic boundary of the character.
3. Never infer author plans, future canon, other characters' secrets, or facts absent from that context.
4. Do not optimize for a satisfying plot. Pursue the character's immediate goal under their desire, fear, relationships, boundaries, and current state.
5. Return behavior as: intent, action, optional dialogue, and a short rationale grounded only in visible context.
6. If required information is absent, act with uncertainty rather than inventing knowledge.

## Quality bar

Prefer subtext, self-interest, imperfect information, avoidance, interruption, and non-verbal action over exposition. A believable refusal or misunderstanding is better than convenient plot progression.
