# 登录注册 / 微信绑定 / 权益归属 现状盘点

> 仅梳理代码内现状，不改代码。末尾列出发现的 7 个潜在不一致点。

---

## 一、登录 / 注册路径（共 7 条主活路径）

| # | 入口 | 后端 | 主账号唯一标识 | 状态 |
|---|---|---|---|---|
| 1 | 邮箱 + 密码登录 | `supabase.auth.signInWithPassword({email})` | `email` | 仅登录，不允许邮箱新注册 |
| 2 | 手机号 + 密码登录（占位邮箱） | `signInWithPassword({email: phone_+86xxx@youjin.app})` | 占位 email | 主链路 |
| 2b | 手机号 + 密码登录（unified-login 灰度） | edge `unified-login` → magicLink | 校验 `pilot_unified_login_phones` 名单 | 灰度试点 |
| 2c | 手机号 + 密码登录（原生 phone 字段兜底） | `signInWithPassword({phone: +86xxx})` | `auth.users.phone` | 兜底批量注册账号 |
| 3 | 手机号 + 密码注册 | `supabase.auth.signUp({email: 占位 email})` + `check_phone_exists` 前置 | 占位 email | 主链路 |
| 4 | 手机号验证码登录/注册 | edge `verify-sms-login` → magicLink/创建 | 占位 email + profile.phone | 已有/新建自动分流 |
| 5 | 微信公众号 OAuth 登录 | edge `wechat-oauth-callback` → magicLink | `wechat_user_mappings.openid` 映射到既有用户 | **未绑定即拒绝**（重定向 `/auth?wechat_pending=1`） |
| 6 | 微信小程序 jscode2session | edge `miniprogram-login` 仅返回 openid | 不签发 session | 由前端再走绑定/支付 |
| 7 | 支付落账自动建号 | edge `create-user-from-payment`（仅服务端调用） | `wechat_user_mappings.openid` 或新建 `wechat_xxx@temp.youjin365.com` | **仍会建临时账号** |

> 说明：上一步「禁用微信临时账号注册」只在 OAuth 回调里做了；`create-user-from-payment` 仍会建 `wechat_*@temp.youjin365.com`。

---

## 二、微信绑定（openid ↔ system_user_id）

`wechat_user_mappings` 是绑定关系单一来源，触发写入的入口：

1. **OAuth 回调**：`wechat-oauth-callback` 命中已绑定 → 直接登录；未绑定 → **不再自动建号**，跳 `/auth?wechat_pending=1`，前端 `Auth.tsx` 用 `sessionStorage('pending_wechat_bind')` 在登录成功后调用 `get-wechat-bind-url` 拉起授权完成绑定。
2. **手机号绑定微信用户的反向操作** `bind-phone-to-wechat`（仅供"老 temp 微信账号"补绑手机号）：
   - 校验当前用户邮箱含 `@temp.youjin365.com`（"是微信临时号"才允许）；
   - 校验 SMS 验证码；
   - 手机号已属另一微信号 → 409 拒绝；
   - 手机号已属普通号 → 执行 **账号合并**：迁移 `orders / conversations / awakening_entries / breathing_sessions / ai_coach_calls / user_camp_purchases / user_accounts(累加 total_quota) / wechat_user_mappings`，软删 temp profile，重新签发手机号账号 session。
   - 手机号未注册 → 仅写入当前 temp 用户的 profile.phone（**未把账号转为正式手机号账号**，只是补字段）。
3. **支付建号** `create-user-from-payment`：openid 已映射 → 复用账号；否则新建 `wechat_*@temp.youjin365.com` 并写映射。
4. **小程序登录**：仅返回 openid，绑定/建号靠后续支付或微信 OAuth 链路。
5. **公众号扫码关注/事件回调**：`wechat-callback` 同步 `wechat_user_mappings.subscribe_status`（只更新订阅状态，不创建账号）。

`useWeChatBindStatus` 给前端用：判定"邮箱注册 + 未绑定 → `needsBindPrompt`"，靠 profile 上的 `wechat_bind_prompted/_at` 7 天节流。

---

## 三、权益归属（订单 → 账号 → 权益）

### 3.1 订单单一真理
- `orders.status='paid'` 是任何"已购"判定的唯一来源（按 mem://technical/camp/purchase-verification-logic-zh）。
- `user_camp_purchases / subscriptions / user_accounts.total_quota` 是派生的"权益视图"，可在订单成功后写入或后台 self-heal。

### 3.2 权益发放路径

| 路径 | 触发点 | 动作 |
|---|---|---|
| A. 已登录支付 | 微信/支付宝 webhook → `wechat-pay-callback` / `alipay-callback` | 标 `orders.paid` + 直接给购买用户发放配额 / camp / subscription |
| B. 游客（未登录）支付后认领 | 用户登录后 `useAuth` 监听 `SIGNED_IN` 读 `localStorage('pending_claim_order')` → `claim-guest-order` | 1) 若订单 user_id=null：绑定到当前用户；2) 若订单已绑到"微信临时账号"（`profiles.phone` 为空 或 `display_name='微信用户'`）：**跨账号迁移** orders + user_camp_purchases + subscriptions 到当前用户；3) 用 `orders.quota_credited_at` 原子锁幂等加配额；4) 触发合伙人佣金 |
| C. 微信公众号支付建号 | `create-user-from-payment` | 创建/复用 temp 微信号 → 绑订单 → 创建 subscription → 累加 user_accounts.total_quota（保留更晚 `quota_expires_at`）→ 20% 写 partner pending |
| D. 套餐 bundle 映射 | `claim-guest-order` 内置 `bundleCampMap`：`synergy_bundle → emotion_stress_7 + emotion_journal_21`、`wealth_synergy_bundle → wealth_block_7` | 多 camp 并发 insert |
| E. 绽放合伙人自动认领 | `useAuth` SIGNED_IN → `auto-claim-bloom-invitation` | 按 phone 匹配 `partner_invitations`，升级 partner、创建 `bloom_partner_orders`、白送 `wealth_block_assessment` 订单 + `wealth_block_7` camp |
| F. 推荐归因 | `useAuth` 注册侧检测 `localStorage('referral_code')` → `process-referral`；`claim-guest-order` 末尾检 `partner_referrals` → `calculate-commission` | 写佣金（按 mem://growth/universal-partner-attribution-and-limit-logic-v3-zh） |

### 3.3 配额账户
- `user_accounts.total_quota / used_quota` 由 `handle_new_user_account` 触发器初始 50；
- 充值类入口：`admin_apply_quota_recharge`、`add_coaching_balance`、`claim-guest-order`、`create-user-from-payment`；
- 扣减：`deduct_user_quota`（带 `quota_expires_at` 校验）。

---

## 四、发现的不一致 / 风险点（需用户决策是否修）

1. **临时账号"半禁用"**：`wechat-oauth-callback` 已禁建 temp 号，但 `create-user-from-payment`（公众号支付落账）仍会建 `wechat_*@temp.youjin365.com`。新公众号支付链路依旧产出临时号。
2. **bind-phone-to-wechat 的"未注册分支"**：当手机号尚未注册时，函数只是把 phone 写进 temp 用户 profile，**没有把邮箱改成占位邮箱也没有重置密码**，导致这个号永远停留在 `wechat_*@temp.youjin365.com`，不能用"手机号+密码"再次登录，只能微信单端登录。
3. **claim-guest-order 跨账号迁移判定脆弱**：判"是否微信临时账号"用 `!ownerProfile.phone || display_name==='微信用户'`，display_name 容易被用户改成别的，可能导致跨账号迁移没触发。
4. **verify-sms-login 第二段查找**：那段"通过 auth.users.phone 兜底"实际上 RPC 调的是 `check_phone_exists`（只返回 boolean），后续又从 profiles 查一遍——和首段重复，没真正查到 auth.users.phone，等同于死代码。
5. **`useWeChatBindStatus.isEmailUser` 判定**：`!email.startsWith('wechat_') && includes('@') && !includes('@temp.youjin365.com')`——这会把 `phone_+86xxx@youjin.app` 占位邮箱也视作"邮箱用户"，给手机号注册用户也弹微信绑定提示。可能符合预期、也可能扰民。
6. **create-user-from-payment vs claim-guest-order 重复加配额风险**：A 路径可能在 webhook 已发权益，B 路径再 `claim-guest-order`。`claim-guest-order` 用 `quota_credited_at` 加锁防双发；但 `create-user-from-payment` 没有写这个锁，存在"先 webhook 加配额，后又 claim 加一遍"的窗口。
7. **subscriptions upsert onConflict='user_id'**：`claim-guest-order` 用 `onConflict: 'user_id'`，意味着"同一个用户买第二个套餐会覆盖前一个 subscription 的 package_id / end_date"，跨套餐叠加场景下会丢历史订阅。

---

## 五、不在本次盘点范围（如需可后续展开）

- `wechat-oauth-process`（替代/共用 OAuth 处理的另一入口）
- `wechat-callback`（公众号事件 / 关注 / 取关）
- `pay-with-prepaid` 余额扣款
- `process-referral` / `calculate-commission` 内部佣金算法
- 邀请码 `claim-partner-entry` / `claim-partner-invitation` 分支差异

---

## 下一步

请告诉我要不要我继续：
- (a) 修复以上 1–7 中的某几个；
- (b) 展开第五节其它子流程；
- (c) 输出一张「账号生命周期 + 权益流转」的 mermaid/ASCII 图。