# ADR-008：Actor / Arbiter Child Session 必须 Resource-isolated

**状态：v0.3 Accepted**

Child Session 禁用普通 Extensions、Skills、Templates、Themes、Project Context Files 与追加 System Prompt，只开放专用 Structured Submit Tool。Fresh Session 本身不足以保证 Knowledge Isolation。
