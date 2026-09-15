# ADR-009：Narrative Predicate 使用声明式数据，不执行代码

**状态：v0.4 Accepted**

Game Flow Condition 使用 JSON Predicate DSL，由确定性代码求值；不执行 JavaScript、Shell、Template Expression 或 LLM Free-form Condition。受限 DSL 更安全、可 Diff、可 Replay、可导出。
