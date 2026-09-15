# MVP v0.2 — Actor Runtime

v0.2 验证 Pi 能否用隔离 Actor Session 顺序执行 Scene，同时不泄漏 Author Knowledge 或其他角色私有推理。

关键能力：持久可恢复 Simulation、确定性 Turn Order、每 Turn 重新构建隔离 Context、Public/Private Transcript 分离、Structured ActorResponse、Pi SDK Child Session、Replay/Resume。

有意限制：Round-robin、无自动 World State Mutation、无 Relationship/Knowledge Delta 应用、无 Branch/Quest、继承父 Pi Model、Actor 不并行。

结果：Domain Runtime 保持 Harness-independent，`src/pi-actor-runner.ts` 作为 Pi Adapter，每个 Turn 创建新的 In-memory Child Session。
