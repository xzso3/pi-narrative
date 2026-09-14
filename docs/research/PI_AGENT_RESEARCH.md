# Pi Agent research findings

Date: 2026-09-14

## Question

Can Pi's package/extension system serve as the host for a reusable game narrative production pipeline combining structured narrative state, roleplay simulation, writing, review, and later multi-agent orchestration?

## Findings

### 1. Pi is intentionally extensible rather than workflow-heavy in core

Current upstream documentation describes Pi as a minimal terminal coding harness extended through TypeScript extensions, skills, prompt templates, themes, and Pi packages. This is a strong fit for a domain-specific Narrative layer because the project does not need to fork Pi core.

Upstream:
- https://github.com/earendil-works/pi
- `packages/coding-agent/docs/index.md`

### 2. Pi packages bundle extensions and skills

Pi packages can declare resources under a `pi` key in `package.json`, or rely on conventional `extensions/` and `skills/` directories. Git and npm installation are both supported.

Upstream:
- `packages/coding-agent/docs/packages.md`

Architectural implication: distribute runtime and narrative methods as one installable artifact.

### 3. Extensions provide the infrastructure hooks needed by the MVP

Extension examples show custom tools, commands, lifecycle events, UI confirmation, and project-level behavior. This enables deterministic data access/validation while leaving narrative reasoning in skills and models.

Upstream:
- `packages/coding-agent/examples/extensions/README.md`
- `packages/coding-agent/docs/extensions.md`

### 4. Skills are suitable for progressive-disclosure narrative expertise

Skills can encode role-specific methodology without putting every writing rule into the always-on system prompt. Narrative Director, Actor, Writer, and Reviewer therefore belong in separate skills.

Upstream:
- `packages/coding-agent/docs/skills.md`

### 5. SDK/RPC leave a migration path beyond the terminal

Pi exposes programmatic session creation and an RPC mode, making it plausible to add a custom narrative GUI or game-editor integration later without replacing the narrative domain model.

Upstream:
- `packages/coding-agent/docs/sdk.md`
- `packages/coding-agent/docs/rpc.md`

## Conclusion

Pi is suitable as the **agent harness and UX host**, but it should not become the story database. Narrative source-of-truth stays in versioned project files behind a harness-independent domain core. Pi-specific code is an adapter.
