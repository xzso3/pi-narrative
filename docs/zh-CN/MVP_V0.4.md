# MVP v0.4 — Game Narrative Semantics

目标：把 Replay 后的 Narrative State 转化为确定性 Game Flow，而不是让 LLM 解释游戏规则。

实现 Declarative Predicate、Scene Entry/Exit Gate、Authored Player Choice、Choice Event、Branch Resolution + Target Gate、Derived Quest/Objective、Timeline Constraint、Gameplay Consequence 与 Pi Tool/Command。

明确不做：执行 Unity Consequence、任意表达式/JavaScript、通用脚本、复杂 Quest Cycle、稳定 Export Schema、Multiplayer、GUI Graph Editor。

相同 State/Event History 必须得到相同 Choice/Quest/Branch/Gate/Timeline 结果。
