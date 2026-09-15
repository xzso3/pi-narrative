# Pi Narrative

> 基于 Pi 的 Agent 游戏叙事中间件：角色隔离模拟、事件溯源世界状态、确定性游戏叙事语义，以及面向 Unity 的引擎边界。

[English](README.md) · [中文文档](docs/zh-CN/README.md) · [English Docs](docs/README.md) · [路线图](docs/zh-CN/ROADMAP.md)

**当前版本：v0.5 — Engine Integration / Export Layer MVP**

Pi Narrative 最初只是一个“能否用 Roleplay Agent 辅助游戏剧本创作”的实验，现在已经发展成一套具有明确权责边界的小型叙事运行时。

> **LLM 可以提出或裁决具有不确定性的角色行为，但游戏规则与持久状态变化必须由确定性代码验证。**

## Pi Narrative 提供什么

- **角色知识隔离**：Actor 不会看到作者未来设定，也不会看到其他角色的私有心理状态。
- **Actor / Arbiter 分离**：Actor 只能尝试行动；不确定行为只有经过 Arbiter 与 State Engine 后才能成为世界事实。
- **事件溯源状态**：`state/initial.json + events/*` 是可变叙事状态的事实来源。
- **确定性 Game Semantics**：Scene Gate、Choice、Branch、Quest、Timeline 都是 JSON 规则，而不是 LLM 即兴判断。
- **人工 Canon Gate**：Simulation 和 Draft 不会自动进入正式 Canon。
- **Engine Boundary**：Unity-friendly DTO、稳定 Delivery ID、ACK Ledger、Save Snapshot、Checkpoint、Localization ID 与 Project Validation。

# 快速开始

## 前置条件

- 已安装并可运行 Pi；
- 若要运行 Actor/Arbiter Simulation，需要配置可用模型；
- 仓库开发需要 Git 与 Node.js **22.19+**。

## 路径 A — 只安装 Pi Package

```bash
pi install https://github.com/xzso3/pi-narrative
```

> `pi install` 不会把本仓库 `examples/` 自动复制到当前目录。

## 路径 B — 克隆仓库并运行 Demo

```bash
git clone https://github.com/xzso3/pi-narrative.git
cd pi-narrative
pi install .
cd examples/roadside-station
pi
```

进入 Pi 后：

```text
/narrative-status
/narrative-state
/narrative-flow fuel-bargain
/choices fuel-bargain
```

# Step-by-Step 使用教程

## 第 1 步 — 查看初始状态

```text
/narrative-state
/narrative-flow fuel-bargain
```

State 由 `narrative/state/initial.json + narrative/events/*.json` 重建；`state/current.json` 只是可重建缓存。

## 第 2 步 — 查看可选项

```text
/choices fuel-bargain
```

Demo 中的两个 Option：

```text
departure / trade-medicine-for-fuel
departure / accept-shelter
```

## 第 3 步 — 执行确定性 Choice

```text
/choose departure trade-medicine-for-fuel
```

确认后检查：

```text
/narrative-state
/narrative-flow fuel-bargain
/quests
/timeline
```

要测试另一条路线，可重置：

```bash
git restore examples/roadside-station/narrative
```

再执行：

```text
/choose departure accept-shelter
```

## 第 4 步 — 运行 Actor / Arbiter Simulation

需要 Pi 中已有模型：

```text
/simulate-scene fuel-bargain 4
```

Actor 只提出 Attempt；Arbiter 裁决不确定后果；确定性代码验证 StateDelta 后才写入 NarrativeEvent。Actor 不看到作者未来信息，私有 Intent/Rationale/Emotion 不泄漏给其他 Actor。

## 第 5 步 — 导出到游戏引擎

```text
/engine-export unity
```

查看 `narrative/exports/unity/latest.json`。Export 包含 Versioned Schema、Event Cursor、Unity-friendly State DTO、Pending Consequence、Localization IDs 与 `snapshotId`。

## 第 6 步 — 安全消费并 ACK

Delivery 是 **at-least-once**。Consumer 必须先用 `deliveryId` 去重，再执行副作用。成功后：

```text
/engine-ack unity <delivery-id>
```

未 ACK 的 Consequence 保持可重新投递；ACK 本身是幂等的。

## 第 7 步 — Save / Checkpoint

```text
/engine-save unity slot1
/engine-checkpoint chapter-1-end
```

## 第 8 步 — Validate

```text
/engine-validate
```

或：

```bash
npm test
npm run check
npm run validate:project -- examples/roadside-station
```

## 第 9 步 — 创建自己的项目

建议从 `examples/roadside-station` 复制，然后依次替换：`project.json`、`world.json`、`characters/*.json`、`state/initial.json`、`scenes/*.json`、`choices/*.json`、`branches/*.json`、`quests/*.json`、`timeline.json`。

更详细教程见 [docs/zh-CN/GETTING_STARTED.md](docs/zh-CN/GETTING_STARTED.md)。

# 项目数据权威层级

```text
Authored definitions          → 规则 / 输入
initial.json + events/*       → 可变叙事事实
current.json                  → Replay Cache
Quest/Branch/Choice 结果      → 派生语义视图
ACK/Export/Save/Checkpoint    → 派生集成状态
canon/*                       → 人工批准的正式资产
```

# 命令速查

```text
/narrative-status
/narrative-state
/narrative-flow [scene-id]
/choices [scene-id]
/choose <choice-id> <option-id>
/quests
/timeline
/simulate-scene <scene-id> [max-turns]
/canonize <scene-id>
/engine-export [consumer-id]
/engine-ack <consumer-id> <delivery-id> [delivery-id...]
/engine-save [consumer-id] [slot-id]
/engine-checkpoint [label]
/engine-validate
/engine-migrate
```

# 中文文档

- [中文文档索引](docs/zh-CN/README.md)
- [架构](docs/zh-CN/ARCHITECTURE.md)
- [领域模型](docs/zh-CN/DOMAIN_MODEL.md)
- [Actor Runtime](docs/zh-CN/ACTOR_RUNTIME.md)
- [State Engine](docs/zh-CN/STATE_ENGINE.md)
- [Game Semantics](docs/zh-CN/GAME_SEMANTICS.md)
- [Engine Integration](docs/zh-CN/ENGINE_INTEGRATION.md)
- [ADR](docs/zh-CN/decisions/)

`npm run check:docs` 会检查所有用户可见 Markdown 是否存在简体中文镜像。

## 开发

```bash
npm test
npm run check
npm run validate:project -- examples/roadside-station
```

## Roadmap

下一阶段是 **v0.6 Authoring UX**：Graph/Dashboard、State/Knowledge Inspector、Timeline/Branch Visualization、Replay Review 与 Pi SDK/RPC-backed Authoring App。

## License

MIT，见 [LICENSE](LICENSE)。
