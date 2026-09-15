# Actor Runtime v0.3

## 已裁决 Turn Pipeline

```text
Persisted Simulation
      ↓ nextActorId()
Actor Context Builder
      ↓ Authored Knowledge Filter + 自身 Mutable State + Public History
ActorTurnContext
      ↓
资源隔离的 Pi Actor Child Session
      ↓ submit_actor_response
ActorResponse
      │ action = 尝试
      ▼
ArbiterContext
  - Public Scene Conditions
  - 当前 Mutable State
  - 尝试的 Action / Dialogue
  - 不含 Actor Intent / Rationale / Emotion
      ↓
资源隔离的 Pi Arbiter Child Session
      ↓ submit_arbiter_decision
ArbiterDecision
      ↓ 确定性验证
NarrativeEvent
      ↓ Append + Replay
Mutable State
      ↓
持久化已裁决 Simulation Turn
```

## Public 与 Private Transcript

其他 Actor 可以看到：Turn Number、Character ID、Attempted Action、Spoken Dialogue、Arbiter Outcome 与 Observable Result。

不能看到：intent、rationale、emotionalShift、Arbiter 内部 reason、Author-only facts。

## Session 隔离

Actor 与 Arbiter Session 都是短生命周期的，并使用自定义 Resource Loader 禁用普通项目 Extensions、Skills、Prompt Templates、Themes、Context Files 与追加 System Prompt。每个 Session 只得到一个专用 System Prompt 和一个 Submit Tool。

## Replay 与恢复

Simulation JSON 保存已裁决 Turn。可变世界事实独立从 `state/initial.json + events/*` 重建。如果 Event 已写但 Transcript 尚未写就崩溃，恢复流程不会重复调用 Actor/Arbiter 或重复应用状态变化。

## v0.4 Scene Gate 集成

创建 Simulation 前，`createSimulation()` 会计算 Scene 的确定性 `entryCondition`。Gate 为 false 时会在任何 Actor Child Session 启动前拒绝 Simulation。
