# ADR-006：Arbiter 负责可变世界事实

**状态：v0.3 Accepted**

Actor Output 永远只是 Attempt。独立 Arbiter 根据当前 State 与 Public Scene Condition 生成 Structured Decision / Typed Delta，再由 Deterministic Code 验证提交，避免角色模型同时渴望并宣布结果成功。
