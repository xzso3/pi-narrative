# 架构 v0.5

## 分层

```text
Pi 创作会话
 ├─ Skills
 ├─ narrative-runtime extension
 └─ engine-integration extension
          ↓
Harness-independent Domain / Runtime
 ├─ core.js
 ├─ runtime.js
 ├─ state-engine.js
 ├─ semantics.js
 └─ engine-integration.js
          ↓
隔离 Actor / 隔离 Arbiter
          ↓
版本化项目文件
          ↓
EngineExport DTO
          ↓
Unity / Runtime
```

Domain、Runtime、Semantics 与 Engine Export 逻辑不依赖 Pi Session；Pi 特有 Adapter 限定在 `src/pi-*-runner.ts`，Tool/Command 限定在 `extensions/`。

## 权威边界

1. **Actor**：基于过滤后的知识提出角色行为。
2. **Arbiter**：把不确定的自然语言尝试裁决成候选 Delta。
3. **Authored Semantic Rules**：设计师拥有的确定性规则，例如 Choice Effect 和 Scene Gate。
4. **Engine Consumer**：执行导出的 Gameplay Consequence，但 ACK 不能反过来改写 Narrative Truth。

## 数据生命周期

Narrative Truth 位于 Authored Definitions、`state/initial.json + events/*`、Draft/Canon 等层；`runtime/<consumer>/acks.json`、`exports/`、Save、Checkpoint 属于派生集成数据。

Quest、Choice Availability、Scene Gate 和 Branch Target 全部由 Replay State + Event History 派生，不维护第二份可变真相。

## Engine Delivery 安全

Gameplay Consequence 使用稳定 `deliveryId`。Delivery 为 at-least-once；Consumer 必须先去重再执行副作用，处理成功后再 ACK。

## Canon 策略

Canonization 必须由人显式确认。Simulation Event、派生 Game Flow 与 Engine ACK 都不会自动成为正式 Canon。
