# ADR-003: Character knowledge isolation is enforced in code

Status: Accepted

Actor prompts must be constructed from a filtered context object. The system never asks a model to "ignore" author knowledge that has already been placed in its context.
