# 发布与安装

公共仓库：`https://github.com/xzso3/pi-narrative`。

安装：

```bash
pi install https://github.com/xzso3/pi-narrative
```

本地开发：

```bash
git clone https://github.com/xzso3/pi-narrative.git
cd pi-narrative
pi install .
```

发布前：

```bash
npm test
npm run check
npm run validate:project -- examples/roadside-station
```

PR 还会经过 GitHub Actions。行为/Protocol 变化更新 CHANGELOG；Project Schema 变化提供显式 Migration；Engine Protocol 变化必须保持 Delivery Semantics 或提升 Schema Version。
