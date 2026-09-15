# ADR-001：使用 Pi 作为 Harness，而不是 Domain Core

**状态：Accepted**

Pi 负责 Agent Execution、Tools、Commands、UI、Skills 与后续 Session Orchestration；Narrative State 与规则保留在独立 Core 和 Project Files 中。

原因：故事资产必须能够跨模型、Harness 和 UI 的变化继续存在。
