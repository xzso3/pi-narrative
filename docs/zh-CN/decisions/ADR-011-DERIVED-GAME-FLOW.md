# ADR-011：Quest、Branch 与 Gate State 是派生视图

**状态：v0.4 Accepted**

Quest/Objective Status、Available Branch、Scene Gate 与 Choice Availability 从 Replay State + Event History 派生，不维护独立可变数据库，避免双写同步 Bug。
