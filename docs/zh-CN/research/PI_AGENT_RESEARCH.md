# Pi Agent 调研结论

日期：2026-09-14

## 问题

Pi 的 Package / Extension System 是否适合承载可复用游戏叙事 Pipeline，覆盖 Structured State、Roleplay Simulation、Writing、Review，并为 Multi-agent Orchestration 留空间？

## 结论

1. Pi Core 有意保持极简，Workflow 放在 TypeScript Extension、Skill、Template、Theme 与 Package 层，适合 Domain-specific Narrative Layer。
2. Pi Package 可以一起分发 Extensions 与 Skills，适合把 Runtime 与 Narrative Methodology 作为单一 Artifact 安装。
3. Extension API 提供 Custom Tool、Command、Lifecycle、UI Confirm 等 Hook，可把 Deterministic Validation 放代码，把 Narrative Reasoning 留给 Model/Skill。
4. Skill 适合 Progressive Disclosure 的角色方法论，Director/Actor/Writer/Reviewer 可分开编码。
5. SDK/RPC 为未来 Narrative GUI / Game Editor Integration 留下路径。

## 总结

Pi 适合作为 **Agent Harness 与 UX Host**，但不应该成为 Story Database。Narrative Source of Truth 应保留在版本化 Project Files 与 Harness-independent Domain Core 中，Pi-specific Code 只是 Adapter。
