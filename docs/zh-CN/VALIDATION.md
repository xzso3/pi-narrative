# 验证方案 v0.5

v0.5 合并时，完整仓库 Regression Suite 在 GitHub Actions 中为 **40/40 通过**。

覆盖 Knowledge Isolation、Actor/Arbiter Runtime、StateDelta、Replay/Revision Conflict、Game Semantics、Scene Gate、Choice/Branch/Quest/Timeline、Engine DTO、Delivery ID、Redelivery-until-ACK、ACK Idempotency、Save Snapshot、Checkpoint、Migration、Localization 与 Engine Validator。

CI：

```bash
npm run check
npm run validate:project -- examples/roadside-station
```

当前文档维护还通过 `npm run check` 调用 `check:docs`，确保英文用户文档存在简体中文镜像。

手工 Smoke Test：clone + `pi install .` → `/narrative-state` → `/narrative-flow fuel-bargain` → `/choose ...` → `/quests` `/timeline` → `/engine-export unity` → `/engine-ack ...` → `/engine-save ...` `/engine-checkpoint ...` → `/engine-validate`。

Actor/Arbiter Live Model Smoke Test 需要另行配置 Pi 模型，再运行 `/simulate-scene fuel-bargain 4`。
