# Skill 参考：Game Narrative Semantics

对应 `skills/game-narrative-semantics/SKILL.md`。

把 Narrative Intent 转成确定性 Condition、Choice、Branch、Quest、Scene Gate、Timeline 与 Gameplay Consequence。不要把游戏逻辑写成 Prose，也不要让 LLM 判断 Condition。

Predicate DSL：const/all/any/not/compare/event。Choice Effect 是 Authored Rule；Branch 同时检查目标 Gate；Quest Status 派生；Timeline Constraint 诊断连续性；Gameplay Consequence 是 Engine-facing Descriptor。
