# Narrative State Engine

`initial.json` 是 revision 0 Snapshot；`events/*` 是后续权威变化；`current.json` 只是可重建 Cache。

## Turn Resolution

Actor Action 是尝试，Arbiter 给出 outcome/observableResult/deltas，`validateArbiterDecision` 后才 `commitNarrativeEvent`。

LLM 不直接写 State JSON。

## Delta

- ResourceDelta：有限数值，不得变负。
- RelationshipDelta：Metric 限定 `[-1, 1]`。
- KnowledgeDelta：Fact 必须存在且 Actor-visible；Knowledge 仅单调 add。
- StateDelta：Character Scope 写 attributes，World Scope 写 public world.flags。

## Replay 与并发

Event 保存 revisionBefore/revisionAfter；baseRevision 不匹配则拒绝写入。Replay 要求连续 Revision Chain。Compound Delta 按顺序 Preview 验证，不能通过多个单独合法的扣减绕过下界。

## Crash Recovery

Event 先于 Simulation Transcript 写入。确定性 Event ID 加 Private ActorResponse 允许恢复缺失 Turn，而不重复调用模型或重复应用 Delta。

## Event Source

v0.4 支持 actor-turn、choice、system 三类 Source，共用同一 Revision Chain 和 StateDelta 验证。Choice Event 可以带 gameplayConsequences，但 Descriptor 本身不直接修改 Narrative State。
