# 贡献指南

保持 Domain Core 与具体 Agent Harness 解耦。新的 Pi-facing 行为应放在 `extensions/` 或 `skills/` 下。

任何改变 Knowledge Visibility、State Authority、Delivery Semantics 或 Canon Semantics 的修改都必须增加 Regression Test；如果改变架构不变量，还必须补充 ADR。

## 文档双语同步

- 英文保留在现有 Canonical Path；
- 简体中文镜像位于 `docs/zh-CN/` 与根目录 `*.zh-CN.md`；
- Skill 中文参考位于 `docs/zh-CN/skills/`，可执行 `skills/*/SKILL.md` 保持英文。

新增/重命名 Markdown 文档时，应在同一个 PR 中更新中文镜像。`npm run check:docs` / `npm run check` 会强制检查覆盖率。

## 提交 PR 前

```bash
npm test
npm run check
npm run validate:project -- examples/roadside-station
```
