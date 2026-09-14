# ADR-008 — Actor and Arbiter child sessions are resource-isolated

**Status:** Accepted in v0.3; hardens ADR-004

## Decision

Pi child sessions used for Actor and Arbiter execution disable normal extensions, skills, prompt templates, themes, project context files, and appended system prompts. They expose only one purpose-built structured submit tool.

## Why

A fresh session is not sufficient epistemic isolation if the default resource loader can rediscover project-level instructions or extensions. Character and Arbiter contexts must be the complete authority available to their model calls.

## Consequences

- Actor/Arbiter methods are encoded in their dedicated system prompt rather than dynamically loaded skills.
- Author-facing Pi still has package skills and tools.
- Future child-session capabilities must be explicitly allowlisted.
