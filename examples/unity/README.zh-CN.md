# Unity Integration 示例

`PiNarrativeDtos.cs` 对应 v0.5 公共 Engine Export DTO。它使用 Array 而不是 Runtime Dictionary，以适配 Unity `JsonUtility` 和其他较保守 Serializer。

推荐流程：

1. Deserialize Engine Export；
2. 加载本地已执行 `deliveryId` 集合；
3. 已执行 ID 跳过，未执行则应用副作用并持久化 ID；
4. 向 Pi Narrative ACK 已安全处理的 ID。

ACK 不是 Exactly-once Transaction。真正保证 Redelivery 安全的是 Consumer 本地 `deliveryId` Ledger。
