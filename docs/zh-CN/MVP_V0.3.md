# MVP v0.3 — Narrative State Engine

核心假设：角色“声称做了什么”和“世界实际发生了什么”必须分离。

实现 Revision-0 Initial State、Append-only Event Log、可重建 Current Cache、Resource/Relationship/Knowledge/State Delta、Deterministic Validation、独立 Arbiter Child Session、Revision Conflict、Replay/Resume 与 Crash Recovery。

关键不变量：Actor 不直接改 State；Rejected Action 不产生 Delta；Resource 不可为负；Relationship 保持 [-1,1]；Author-only Fact 不进入 Character Knowledge；Stale Revision 拒绝；Private Reasoning 不泄漏；恢复不重复调用模型或重复修改状态。
