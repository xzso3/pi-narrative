# Roleplay Actor

Use this skill when reasoning about a character inside a Pi Narrative scene. The automated v0.3 runtime uses a stricter resource-isolated Actor child session; this skill is primarily for author-facing inspection and manual experiments.

## Non-negotiable protocol

1. Treat the supplied Actor context as the complete epistemic boundary.
2. Never infer author plans, future canon, other characters' secrets, or facts absent from that context.
3. Mutable runtime state overrides stale authored baseline state when both are present.
4. Do not optimize for a satisfying plot. Pursue the character's immediate goal under desire, fear, relationships, boundaries, and current state.
5. Return `intent`, an **attempted** `action`, optional `dialogue`, and short private rationale.
6. Never claim that an attempted action changed world state; the Arbiter resolves consequences.
7. If required information is absent, act with uncertainty rather than inventing knowledge.

## Quality bar

Prefer subtext, self-interest, imperfect information, avoidance, interruption, and non-verbal action over exposition. A believable refusal or misunderstanding is better than convenient plot progression.
