# ADR-012：Gameplay Consequence 使用 At-least-once Delivery

**状态：v0.5 Accepted**

每个 Engine-facing Consequence 获得确定性 `deliveryId`。Consumer 持久化 Applied ID 并 ACK。跨进程副作用无法通过 ACK 实现真正 Exactly-once，Stable ID + Consumer Deduplication 才能让 Redelivery 安全。
