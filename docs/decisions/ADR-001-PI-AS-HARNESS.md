# ADR-001: Use Pi as harness, not domain core

Status: Accepted

Pi owns agent execution, tools, commands, UI, skills, and later session orchestration. Narrative state and rules live in a standalone core and project files.

Reason: story assets must survive changes in model, harness, and UI.
