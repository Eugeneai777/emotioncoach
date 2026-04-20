
## 现状
`/emotion-health` 未登录跳 `/auth`，登录后兜底回 `/mini-app`，未带回测评页。

## 方案
找到 `/emotion-health` 路由对应组件中所有 `navigate('/auth')` 调用，在跳转前：
1. 写入 `localStorage.auth_redirect = '/emotion-health'`（带 15 分钟 TTL，复用现有工具）
2. URL 带上 `?redirect=/emotion-health`

登录后按现有 4 级优先级（URL `?redirect=` → `auth_redirect` 缓存）自动回到 `/emotion-health`：
- 已购 → 直接进入答题
- 未购 → 自动弹 9.9 付费弹窗

## 改动范围
- 仅修改 `/emotion-health` 入口组件中的 auth 跳转逻辑（预计 1-2 处 `navigate('/auth')`）
- 不动 `/auth` 页、`postAuthRedirect`、其他测评页

确认后进入实现模式。
