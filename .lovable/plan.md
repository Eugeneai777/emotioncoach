

## 分析

已发布站点的 `version.json` 返回版本号 `1773825710683`，说明部署是生效的。版本检查机制（`useVersionCheck`）也正常运行在 App 中。

**最可能的原因**：上次点击 Publish → Update 时，最新的代码改动尚未包含在构建中（Lovable 的构建可能使用了缓存的旧产物）。

## 修复方案

在代码中做一个无害的微小改动（如在 `MiniAppEntry.tsx` 添加一行注释），强制触发全新构建，然后重新发布。这样新的 `__APP_VERSION__` 会与旧缓存不匹配，`useVersionCheck` 会自动刷新用户端页面。

| 文件 | 改动 |
|------|------|
| `src/components/mini-app/MiniAppEntry.tsx` | 顶部添加一行注释 `// force rebuild` |

发布后用户端会自动检测到新版本并刷新。

