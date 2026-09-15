# ADR-007：Event Log 是 Mutable State 的事实来源

**状态：v0.3 Accepted**

`narrative/state/initial.json` 加有序 `narrative/events/` 定义当前可变状态；`current.json` 只是 Cache。Event Sourcing 保留因果、Review、Recovery、Diff 与 Replay 能力。
