# ADR-010：设计师明确配置的 Choice Effect 绕过 LLM Arbiter

**状态：v0.4 Accepted**

设计师已明确写出 StateDelta 时，由 Deterministic Code 直接验证 Commit。Arbiter 只用于裁决不确定的自然语言角色尝试。
