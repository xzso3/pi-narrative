# 入门教程 — Step-by-Step

这是 README 中教程的长版说明。

## 1. 选择使用方式

### 在现有项目中只安装 Pi Package

```bash
pi install https://github.com/xzso3/pi-narrative
```

然后在你自己的 Narrative Project 根目录启动 Pi。

### 运行仓库自带 Demo

```bash
git clone https://github.com/xzso3/pi-narrative.git
cd pi-narrative
pi install .
cd examples/roadside-station
pi
```

仓库开发需要 Node.js 22.19+。

## 2. 先验证确定性层

```text
/narrative-status
/narrative-state
/narrative-flow fuel-bargain
/choices fuel-bargain
```

这些命令不需要 Actor/Arbiter 模型调用。

## 3. 执行玩家 Choice

```text
/choose departure trade-medicine-for-fuel
```

确认写入，然后检查：

```text
/narrative-state
/narrative-flow fuel-bargain
/quests
/timeline
```

重置 Demo：

```bash
git restore examples/roadside-station/narrative
```

## 4. 运行模型驱动的 Simulation

Pi 配置好模型后：

```text
/simulate-scene fuel-bargain 4
```

Actor 提出动作，Arbiter 裁决不确定结果，确定性代码验证并提交 StateDelta。

## 5. 导出到 Unity / 游戏运行时

```text
/engine-export unity
```

查看：

```text
narrative/exports/unity/latest.json
```

Gameplay Consequence 使用稳定 `deliveryId`。

## 6. 消费并 ACK

游戏端必须用 `deliveryId` 本地去重。执行成功后：

```text
/engine-ack unity <delivery-id>
```

未 ACK 的 Consequence 会继续保持可重新投递。

## 7. Save 与 Checkpoint

```text
/engine-save unity slot1
/engine-checkpoint chapter-1-end
```

Save Snapshot 用于游戏端恢复；Checkpoint 用于验证 Event Log 历史前缀和回放状态完整性。

## 8. Validate

```text
/engine-validate
```

或：

```bash
npm test
npm run check
npm run validate:project -- examples/roadside-station
```

## 9. 创建自己的项目

建议从示例目录复制，然后依次替换：

1. `project.json`
2. `world.json`
3. `characters/*.json`
4. `state/initial.json`
5. `scenes/*.json`
6. `choices/*.json`
7. `branches/*.json`
8. `quests/*.json`
9. `timeline.json`

不要手工篡改已经发生的历史 Event；应通过 Runtime 追加新的 NarrativeEvent。
