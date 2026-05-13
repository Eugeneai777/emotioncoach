# 修复方案：问题 1-3 对齐"手机号唯一主账号"模型

## 问题 1：禁用微信"临时账号"自动注册路径

**现状**：`wechat-oauth-callback` 在 register/默认模式下，若未绑定手机号会自动用 `wechat_*@temp.youjin365.com` 建账号并登录，与方案冲突。

**改动**：
1. **后端 `supabase/functions/wechat-oauth-callback/index.ts`**
   - 删除"自动创建 temp 账号 + 签发 magicLink"分支
   - 未绑定时统一返回 `{ error: 'not_registered', openid, unionid?, nickname?, avatar? }`
2. **后端 `supabase/functions/wechat-oauth-process/index.ts`**
   - 同步保证 register/login 模式未绑定时返回 `not_registered` + openid（用于后续补绑）
3. **前端 `src/pages/WeChatOAuthCallback.tsx`**
   - 收到 `not_registered`：把 `openid`(+ 昵称头像) 写入 `sessionStorage('pending_wechat_bind')`
   - 跳转 `/auth?wechat_pending=1`，toast「请先用手机号注册/登录后自动绑定微信」

## 问题 2：/auth 微信入口加引导

**前端 `src/pages/Auth.tsx`**
- 微信登录按钮上方加说明条：「微信登录仅限已绑定手机号的账号；新用户请先使用手机号注册」
- 检测到 URL `?wechat_pending=1`：
  - 顶部展示蓝色提示卡：「检测到微信授权，完成手机号注册/登录后将自动绑定」
  - 默认 Tab 切到「手机号」
- 登录/注册成功后（在 `useAuth` `SIGNED_IN` 钩子或 Auth.tsx 成功回调里）：
  - 若 `sessionStorage('pending_wechat_bind')` 存在 → 调用 `bind-phone-to-wechat`（传 openid），成功后 toast「微信已自动绑定」，清缓存

## 问题 3：历史微信 temp 账号策略（**需用户决定**）

库里现有大量 `wechat_*@temp.youjin365.com` 账号。三选一：

- **A. 保留现状**：老用户继续可用微信直登；只对"新微信"强制走手机号。最低风险。
- **B. 强制补绑**：老 temp 账号下次微信登录后弹窗"请绑定手机号才能继续使用"，未绑定不可访问核心功能。
- **C. 自动迁移**：登录时若该微信对应手机号已注册主账号，复用现有"账号合并"逻辑把 temp 资产转移到手机账号，然后软删 temp。最干净但不可逆。

> 我会先实现问题 1+2（A 方案兼容），等你确认 B/C 后再追加。

## 不改动
- `bind-phone-to-wechat` 逻辑（已支持，复用）
- 设置页绑定/解绑入口（问题 4 暂搁置）
- 现有 RLS、订单、微信支付 openid 缓存

## 技术细节
- `pending_wechat_bind` 用 `sessionStorage` 跨 OAuth 跳转保活
- 绑定调用放在 `useAuth` 的 `SIGNED_IN` 监听里，确保任何登录路径（验证码/密码/SMS）触发后都会自动补绑
- 失败 toast 区分：`already_bound`（提示去解绑）、`network`（重试）

请确认问题 3 选 A/B/C，然后我实现 1+2。
