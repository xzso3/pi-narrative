# Skill 参考：Engine Integration

对应 `skills/engine-integration/SKILL.md`。

NarrativeEvent 仍是 Source of Truth；Engine Export、Save、ACK、Checkpoint 是派生资产。Gameplay Consequence 使用 at-least-once：稳定 deliveryId、Consumer 本地去重、成功后 ACK。ACK 重复幂等，但不能替代 Consumer-side Deduplication。

推荐：engine validate → export → Consumer 去重执行 → ACK → Save → Checkpoint。
