

## 根因（已查实）

用户 13980077597 的 `quota_expires_at = 2026-04-11`，而 `2026-03-12` 支付了 `synergy_bundle`，加 30 天恰好就是 4-11。

**两层问题**：
1. **数据配置问题**：`packages` 表中 `synergy_bundle.duration_days = 30`（仅 30 天有效），与「365 天有效期」承诺不符。同表 `member365 / basic = 365 天`、`camp-parent_emotion_21 = 21 天`（训练营专用，合理）。
2. **写入逻辑问题**（`supabase/functions/alipay-callback/index.ts` 第 269-278 行 + `create-user-from-payment/index.ts` 第 207-220 行）：使用 `upsert` / `update` **直接覆盖** `total_quota` 和 `quota_expires_at`，**未取 `GREATEST(now(), 现有 quota_expires_at) + duration_days`**。如果用户已有更长的到期日，新购买的短周期套餐反而会**缩短**到期时间。

历史数据印证：该用户 `member365 / basic` 订单都是 `pending` 未支付，唯一支付的「会员类」就是 30 天的 synergy_bundle，所以 `quota_expires_at` 被锁死为 30 天。

## 修复方案 A + B

### A. 立即修复该用户（数据修正，1 步）

将 `user_accounts.quota_expires_at` 延长到 `now() + 365 天`，让 13980077597 立即可用 50 点。
- 这是一次性 SQL UPDATE，不影响其他用户。

### B. 修复底层逻辑（产品级，4 处）

#### B1. 修正 `synergy_bundle` 套餐有效期
将 `packages.synergy_bundle.duration_days` 从 `30` 改为 `365`，与「全天候抗压套餐」推广承诺一致。
（`wealth_synergy_bundle` 等同款套餐若也有同样问题一并修正。）

#### B2. 写入逻辑改为"延长不缩短"
在所有写入 `quota_expires_at` 的边缘函数中，统一改为：
```ts
const newExpires = new Date();
newExpires.setDate(newExpires.getDate() + (pkg.duration_days || 365));
const finalExpires = existing?.quota_expires_at && new Date(existing.quota_expires_at) > newExpires
  ? existing.quota_expires_at  // 保留更晚的到期日
  : newExpires.toISOString();
```
并把 `total_quota` 改为**累加**（`existing.total_quota + pkg.ai_quota`），不再覆盖。
- `supabase/functions/alipay-callback/index.ts`（269-278 行）
- `supabase/functions/create-user-from-payment/index.ts`（207-220 行）
- `supabase/functions/check-order-status/index.ts`（同模式如有）
- `supabase/functions/wechat-pay-callback/index.ts`（同模式如有）

#### B3. 历史回溯 SQL（一次性）
对 `user_accounts` 中 `quota_expires_at < now()` 但仍有 `total_quota > used_quota` 且名下存在 `orders.status='paid'` 中 `package_key IN ('synergy_bundle','wealth_synergy_bundle','member365','basic')` 的用户，自动延长到 `paid_at + 365 天` 或 `now() + (剩余天数)`。
- 仅修订错误数据，不动其他正常账户。
- 执行前先 SELECT 出影响范围给你确认，再执行 UPDATE。

#### B4. 后端补救（可选，但建议）
`deduct_user_quota` RPC 抛出 `Quota has expired` 时，前端前置 `checkQuota` 增加过期校验，弹「您的套餐已过期，请续费」而不是「余额不足」。  
（这一项已在上一个计划里覆盖，本次不重复实施，等本次 A+B 完成后再做 UI 区分。）

## 改动清单

**数据修正（insert tool 执行 SQL）**
- `UPDATE user_accounts SET quota_expires_at = now() + interval '365 days' WHERE user_id = '5ad9671c-8b4b-4bfd-a47e-42506cc9ceaa';`
- `UPDATE packages SET duration_days = 365 WHERE package_key IN ('synergy_bundle', 'wealth_synergy_bundle');`
- 历史回溯 UPDATE（先 SELECT 影响范围再确认）

**代码改动**
- `supabase/functions/alipay-callback/index.ts`：累加额度 + 取最大到期日
- `supabase/functions/create-user-from-payment/index.ts`：同上
- `supabase/functions/wechat-pay-callback/index.ts`：检查并对齐
- `supabase/functions/check-order-status/index.ts`：检查并对齐

## 不改动
- `deduct_user_quota` RPC（产品规则保留）
- 训练营类短期套餐的 `duration_days`（21/7 天有意为之）
- UI 文案区分（留到下个迭代）

## 验证方式
1. 13980077597 进 `/mama` → 女性 AI 教练应能正常通话（50 点立即可用）
2. 用测试账号支付 `synergy_bundle` → `quota_expires_at` 应为 365 天后
3. 已有用户再次购买 → 到期日只会延长不会缩短
4. 历史回溯后再查一遍受影响用户应全部恢复

