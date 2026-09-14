# ADR-010 — Authored player choice effects bypass the LLM Arbiter

## Status

Accepted in v0.4.

## Decision

When a designer explicitly authors a choice option's StateDelta effects, those effects are validated and committed directly by deterministic code. They do not pass through the LLM Arbiter.

## Why

The Arbiter exists to resolve uncertain natural-language character attempts. Authored choice effects are already game rules. Sending them through an LLM would add nondeterminism and could contradict designer intent.

## Consequence

Free-form Actor behavior remains `Actor → Arbiter → State Engine`. Authored player choices use `Choice → State Engine`.
