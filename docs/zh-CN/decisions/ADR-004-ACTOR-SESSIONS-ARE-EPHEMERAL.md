# ADR-004：Actor Child Session 是短生命周期的，Simulation State 才持久化

**状态：Accepted**

每个 Actor Turn 使用新的 Pi SDK Session，只获得过滤后的 ActorTurnContext；提交 Structured ActorResponse 后立即 Dispose。

原因：防止 Character Context 污染；Replay/Resume 不依赖隐藏 Session Memory；Transcript 可检查；未来可按角色/Turn 路由模型。
