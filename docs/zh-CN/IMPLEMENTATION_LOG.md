# Implementation Log

## 2026-09-14 — MVP Framing

决定先验证确定性的 Narrative State Boundary，再实现 Multi-agent Orchestration。

## 2026-09-14 — Domain Core

实现 JSON Loader、Actor Context Builder、Scene Validator、Simulation Persistence、Canonization 与 Project Status。

## 2026-09-14 — Pi Adapter

实现 Pi Extension，注册 Narrative Tool/Command，并要求 Canonization 人工确认。

## 2026-09-14 — Skills

加入 Director、Roleplay Actor、Scene Writer、Narrative Reviewer，职责相互分离。

## 2026-09-14 — Regression Fixture

Roadside Station Demo 故意包含 Author-only Future Fact 与另一角色秘密，用测试证明它们不会泄漏到 Mara Actor Context。

## 2026-09-15 — v0.3 Narrative State Engine

引入 Revisioned Mutable State、Append-only Event Log、Resource/Relationship/Knowledge/State Delta 与 Deterministic Validator。

## 2026-09-15 — Arbiter Authority Boundary

加入独立 Pi Arbiter Child Session。Actor Action 明确为 Attempt；只有经过验证的 Arbiter Decision 才能成为 Mutable World Truth。

## 2026-09-15 — Replay / Recovery

`initial.json + events/*` 成为权威来源；`current.json` 可重建。加入 Base Revision Conflict 与 Event-before-transcript Recovery。

## 2026-09-15 — Child-session Hardening

禁用 Actor/Arbiter Child Session 中的普通 Extensions、Skills、Templates、Themes、Context Files 与追加 System Prompt。

## 2026-09-15 — v0.4 Predicate / Game Semantics

引入 Harness-independent Predicate Evaluator、Deterministic Choice、Scene Gate、Branch、Quest、Timeline Constraint 与 Flow Snapshot。

## 2026-09-15 — Roadside Station Branching Demo

Demo 扩展为“用药换油向北”与“留下避风”两条路线，并加入 Quest、Timeline 和 Gameplay Consequence。
