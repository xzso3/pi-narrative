# ADR-005：Actor 私有心理状态不进入 Public Transcript

**状态：Accepted**

ActorResponse 可以保存私有 `intent`、`rationale`、`emotionalShift`，但后续 Actor 只收到可观察 `action` 与 `dialogue`，避免 Simulation History 绕过 Knowledge Boundary。
