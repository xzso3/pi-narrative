# Changelog（中文）

## Unreleased - 文档

- 重构 README：加入从零 Quick Start 与 Step-by-Step 教程；
- 增加英文/简体中文文档索引和独立 Getting Started；
- 为仓库全部文档、ADR、Research、Unity README 与 Skill 人类可读说明补齐简体中文镜像；
- 更新 Architecture/Domain/Validation/Publishing 到 v0.5 与 40/40 CI 基线；
- 增加 `check:docs`，由 CI 强制检查中文文档镜像完整性。

## 0.5.0 - 2026-09-15

Engine Integration / Export Layer MVP：
- 增加 Unity-friendly Engine Export DTO 与确定性 Snapshot ID；
- 增加稳定 Gameplay Consequence Delivery ID 与 Per-consumer ACK Ledger；
- 定义 at-least-once Delivery 与 `deliveryId` 去重要求；
- 未 ACK Consequence 保持可重新投递；
- 增加 Save Snapshot、Checkpoint、Localization ID、Schema Migration、CI Validator 与 Unity C# DTO 示例。

## 0.4.0 - 2026-09-15

Game Narrative Semantics MVP：增加 Declarative Predicate、Scene Gate、Choice、Branch、Quest、Timeline 与 Gameplay Consequence。

## 0.3.0 - 2026-09-15

Narrative State Engine MVP：增加 Typed Delta、Arbiter、Revisioned Event Log、Replay、Conflict Detection 与 Crash Recovery。

## 0.2.0 - 2026-09-15

Actor Runtime MVP：增加隔离 Actor Session、Structured ActorResponse、Public/Private Transcript 与 Replay/Resume。

## 0.1.0 - 2026-09-14

首个 Pi Narrative MVP：Package、Knowledge-isolated Actor Context、Scene Validation、Simulation Persistence 与 Human-gated Canonization。
