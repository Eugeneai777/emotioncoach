

# 回填历史数据 + 完善点数明细展示

## 问题根因

`quota_transactions` 表刚建好是空的。一期只在 `deduct-quota` 函数中加了**未来**写入逻辑，但历史数据（该用户已有 20 条 `usage_records` + 1 条购买订单 + 注册赠送）未回填，所以用户看到「暂无点数变动记录」。

## 方案

### 1. 数据库迁移：回填历史数据

用一次性 SQL 从现有表回填到 `quota_transactions`：

**来源 A — `usage_records`（扣费 + 退款记录）**
- `record_type = 'conversation'` → type='deduct', amount 取负值
- `record_type = 'refund'` → type='refund', amount 取正值（原值是负数）
- `record_type = 'camp_entitlement'` → type='free_quota', amount=0
- source 映射中文 description

**来源 B — `orders`（购买充值）**
- `status = 'paid'` 且 `package_key = 'basic'` → type='grant', amount=+150（200总额 - 50注册赠送）
- description = "购买尝鲜会员 +150点"

**来源 C — 注册赠送**
- `handle_new_user_account` 触发器自动给 50 点 → type='grant', amount=+50, description="注册赠送 +50点"
- 取 `user_accounts.created_at` 作为时间

### 2. 前端：优化空状态处理

当 `quota_transactions` 为空但 `remainingQuota` 有值时，不应该隐藏整个区块。当前第 69 行的逻辑已经正确（有 remainingQuota 就显示），只是因为表空才看到「暂无」。回填后自动解决。

## 不影响的内容

- 不修改任何边缘函数
- 不修改 `deduct_user_quota` RPC
- 不修改前端组件逻辑（回填后自然展示）
- 回填 SQL 使用 `ON CONFLICT` 或 `NOT EXISTS` 防重复

## 文件清单

| 文件 | 操作 | 影响面 |
|------|------|--------|
| 数据库迁移 SQL | 回填 `quota_transactions` | 纯追加，不改现有数据 |

单一迁移文件，约 60 行 SQL。回填后用户立即能看到完整的点数流水。

