# MVP v0.5 — Engine Integration / Export Layer

目标：把确定性的 Narrative State 与 Gameplay Consequence 安全交给真实游戏 Runtime，而不让游戏引擎依赖 Pi Session 或 LLM Memory。

实现 Versioned Engine DTO、Unity-friendly Array DTO、Stable deliveryId、Per-consumer ACK Ledger、At-least-once Redelivery、Save Snapshot、Hash-verified Checkpoint、Localization ID、Project Schema Migration、CI Validator、Pi Tool/Command 与 C# DTO Sketch。

不做 HTTP/WebSocket Transport、Exactly-once Transaction、Multiplayer Authority、Binary Asset Delivery、Localization Translation Management、自动 C# Codegen。

关键成功标准：Snapshot 确定性、Delivery ID 稳定、重复 ACK 幂等、未 ACK 必须重投、Checkpoint 检测篡改、Save 携带 Cursor/ACK、Schema 显式迁移、CI 拒绝 malformed data。
