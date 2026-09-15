# Game Narrative Semantics v0.4

v0.4 在 Replay State 与 Event History 之上增加确定性 Game Semantics Layer。它不是 LLM Rules Engine；Actor/Arbiter 处理自由角色行为，作者配置的 Game Flow 由代码求值。

## Predicate DSL

支持 `const`、`all`、`any`、`not`、`compare`、`event`。Path 只做属性遍历，不执行函数或任意代码。

## Scene Gate

Scene 可有 `entryCondition` / `exitCondition`。`createSimulation()` 强制检查 Entry Condition，Exit Condition 只是可查询事实，不自动跳 Scene。

## Choice

Choice 位于 `narrative/choices/*.json`。Option 可配置 availableWhen、outcomeText、deterministic deltas、gameplayConsequences。Choice Effect 是明确游戏规则，绕过 LLM Arbiter，直接由 State Engine 验证和 Commit。

## Branch

Branch 只有自身 `when` 为 true 且目标 Scene Entry Gate 为 true 时可用，因此不能绕过目标 Gate。

## Quest

Quest / Objective 状态按需派生为 locked / active / completed / failed。`dependsOn` 只依赖更早 Objective，避免循环。系统不维护第二份 Mutable Quest Status。

## Timeline

支持 `condition-requires` 和 `event-before`。Timeline Constraint 是诊断不变量，不会自动改写历史。

## Gameplay Consequence

它们是 Engine-agnostic Descriptor；v0.5 在其上定义稳定 Export / ACK 协议。

## Source-of-Truth

```text
Authored Semantics            → 规则
initial.json + events/*       → 可变事实
current.json                  → Replay Cache
Quest/Choice/Branch Result    → 派生视图
```
