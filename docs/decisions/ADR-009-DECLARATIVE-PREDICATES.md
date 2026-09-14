# ADR-009 — Narrative predicates are declarative, not executable code

## Status

Accepted in v0.4.

## Decision

Game-flow conditions use a small JSON predicate DSL evaluated by deterministic code. Pi Narrative does not evaluate JavaScript, shell expressions, templates, or LLM-authored free-form conditions.

## Why

Executable predicates would make narrative data unsafe, difficult to diff, hard to export, and nondeterministic across engine integrations. A constrained DSL is easier to validate, replay, test, and eventually compile into Unity-friendly data.

## Consequence

The DSL is intentionally less expressive than a general scripting language. Missing semantics should be added as explicit operators instead of escaping into arbitrary code.
