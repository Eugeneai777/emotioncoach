
## 问题
用户访问 `https://wechat.eugenewe.net/emotion-health` 未登录 → 跳转登录 → 登录后跳到 `/mini-app`（图1），而不是回到 `/emotion-health`（图2 的 9.9 测评页）。

## 排查方向
登录后重定向遵循 4 级优先级（参见 `mem://auth/redirection-standard-zh`）：
1. URL `?redirect=` 参数
2. `localStorage` `auth_redirect` 缓存（15 分钟 TTL）
3. 内部 `postAuthRedirect`
4. 默认值（很可能就是 `/mini-app`）

`/emotion-health` 页面在触发登录跳转时，大概率没有把当前路径写入 `?redirect=` 或 `auth_redirect` 缓存，导致登录完成后兜底回 `/mini-app`。

## 方案（最小改动，不影响现有逻辑）
1. 定位 `/emotion-health` 路由对应的页面组件（应为 `EmotionHealthLite.tsx` 或其入口包装），找到「未登录 → 跳 `/auth`」的那段逻辑。
2. 在跳转前：
   - 把 `/emotion-health`（含原始 query/hash）写入 `localStorage.auth_redirect`（带 15 分钟 TTL，复用项目现有工具）
   - 同时在跳转 URL 上带上 `?redirect=/emotion-health`
3. 这样登录成功后，按现有 4 级优先级会自动回到 `/emotion-health`，命中已购态 → 进入测评；未购 → 自动弹 9.9 付费弹窗（即图2 行为）。

## 需要确认
不需要改 `/auth` 页或 `postAuthRedirect` 逻辑，只在 `/emotion-health` 入口补登录前的 redirect 写入即可。其他测评页（如 `/wealth-block`）逻辑不动。

确认后我进入实现模式定位文件并落地。
