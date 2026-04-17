

## 修复：套餐支付成功后立即发放点数（对齐 365 会员逻辑）

### 根因
`premium_99` / `standard_49` 订单走完支付流程，但点数没到账。原因：`wechat-pay-callback` 与 `check-order-status` 出现并发竞态——一方把订单更新成 `paid`，另一方看到 "Order already paid" 就**早返回，跳过点数发放**。

365 会员之所以稳定，是因为它走的是订阅创建路径（subscriptions 表 upsert 幂等），而点数发放被绑死在"我是把订单状态从 pending 改成 paid 的那一方"这个条件上——一旦竞态发生就漏发。

### 修复策略：点数发放幂等化

把"是否发点数"的判断**与"订单状态变更"解耦**，改为**与"是否已经发过"挂钩**——和 365 会员订阅 upsert 同样的幂等思路。

**判定"已发过"的依据**：在 `orders` 表新增/复用一个字段标记发放状态。最简方案是用现有 `quota_added`(boolean) 或 `paid_at` 配合 `user_accounts.updated_at` 比较。最稳的方案是新增 `quota_credited_at timestamptz` 列，发放成功后写入；下次任何函数进来都检查此字段，已写则跳过，未写则补发。

### 改动清单

| 项 | 内容 |
|------|------|
| 数据补偿 SQL | 给 15672524437 (`423fed4d-...`) 补 800 点 + updated_at |
| 数据库迁移 | `orders` 表新增 `quota_credited_at timestamptz`（如已有 `quota_added` 则复用） |
| `supabase/functions/wechat-pay-callback/index.ts` | 删除 "Order already paid → 早返回"；改为：无论订单当前状态，只要 `quota_credited_at IS NULL` 就执行点数发放 + 标记字段（用 `UPDATE ... WHERE quota_credited_at IS NULL` 做原子锁防双发） |
| `supabase/functions/check-order-status/index.ts` | 同上幂等化 |
| `supabase/functions/claim-guest-order/index.ts` | 同上幂等化（防游客领取重复发放） |

### 防双发关键 SQL 模式
```sql
UPDATE orders 
SET quota_credited_at = NOW() 
WHERE id = $1 AND quota_credited_at IS NULL
RETURNING id;
```
拿到 RETURNING 的一方才执行 `user_accounts` 加点数，另一方 0 行返回直接跳过——彻底消除竞态。

### 验证
1. 补完 800 点，刷新 /me 看到余额正确
2. 再用 ¥0.01 测一笔 standard_49 / premium_99，确认点数立即到账
3. 检查日志应有 `[Callback] Crediting quota (idempotent claim acquired)` 或 `[Callback] Quota already credited, skip`

约 1 条 SQL 补偿 + 1 条迁移 + 3 个 edge function 各 ~15 行改动。

