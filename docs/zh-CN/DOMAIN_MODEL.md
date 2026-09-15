# 领域模型 v0.5

Schema 保持 JSON 化、确定性、可在 Git 中 Review，并按权威边界分层。

## Authored Narrative Layer

Project：`protocol`、整数 `schemaVersion`、`id`、`title`、`sceneOrder[]`。

WorldFact：`id`、`text`、`actorVisible`。

Character：identity/desire/fear、boundaries/speech、baseline state/relationships、knowledge。

Scene：identity/location/situation、cast、public facts/events、actor goals、可选 entry/exit condition。

## Runtime Simulation Layer

ActorResponse：私有 intent、attempted action、可选 dialogue、私有 rationale/emotionalShift。

ArbiterDecision：outcome、observable result、可选 private reason、deltas。

StateDelta：resource、relationship、knowledge、state。

NarrativeEvent：source 为 actor-turn / choice / system，保存 Revision 边界、Validated Delta、可选恢复数据和 Gameplay Consequence。

Mutable State 的权威来源是 `state/initial.json + events/*`。

## Game Semantics Layer

Condition：const/all/any/not/compare/event。

Choice：Availability、Options、Deterministic Delta、Gameplay Consequence。

BranchRule：fromSceneId / targetSceneId / priority / when。

Quest/Objective 状态派生为 `locked | active | completed | failed`。

TimelineConstraint：condition-requires / event-before。

## Engine Integration Layer

GameplayConsequence 被派生为带稳定 `deliveryId` 的 Delivery。

EngineExport 包含 Protocol/Schema、Project/Consumer Identity、Event Cursor、Unity-friendly State DTO、未 ACK Consequence、Localization Catalog 与确定性 `snapshotId`。

ACK Ledger 是 Consumer-scoped 派生状态。Save Snapshot 保存 Engine-facing State/Cursor/ACK；Checkpoint 对 Event Log Prefix + Replay State 做 Hash。

## Production Layer

Draft 与 Canon 是作者输出。Runtime State 和 Engine Delivery State 都不会自动成为已批准 Canon。
