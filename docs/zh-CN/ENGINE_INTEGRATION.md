# Engine Integration Protocol

Pi Narrative 是 Authoring / Simulation Runtime；Unity 或其他引擎是 Consumer。ACK State 是 Integration State，不是 Narrative Truth。

## Delivery Semantics

协议采用 **at-least-once**。每个 Consequence 获得确定性 `deliveryId`：

```text
pn-<eventRevision>-<eventId>-<index>
```

游戏 Runtime 在执行副作用前必须按 ID 去重。危险窗口是“执行副作用 → 崩溃 → ACK 尚未持久化”，因此 Consumer 本地 Applied-ID Ledger 是 effectively-once 的必要条件。

## Engine Export

包含 Protocol + Schema Version、Project/Consumer Identity、Event Cursor、Unity-friendly State DTO、未 ACK Consequences、Localization、确定性 snapshotId 与 generatedAt。generatedAt 不参与 snapshotId。

## Unity DTO

公共状态使用 Array 而不是动态 Dictionary：characters、attributes、resources、relationships、worldFlags。复杂开放值通过 Typed Value Envelope 或 Canonical JSON String 传递。

## ACK / Save / Checkpoint

ACK Ledger 位于 `narrative/runtime/<consumerId>/acks.json`，重复 ACK 幂等，未知 ID 拒绝。

Save Snapshot 包含 State DTO、Cursor、ACK IDs 和 snapshotId，但不替代 Authoring Event Log。

Checkpoint 对 Revision N 的 Replay State、Event Log Prefix 和有序 Event IDs 做 Hash；新增 Event 不影响旧 Checkpoint，但修改已保护的历史前缀会被发现。

## Project Schema Migration

v0.5 使用整数 Schema Version 1：

```json
{"protocol":"pi-narrative.project/v1","schemaVersion":1}
```

旧字符串标签显式迁移，并保留为 `legacySchemaVersion`。

## CI

```bash
node scripts/validate-project.mjs examples/roadside-station
```
