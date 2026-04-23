

## 「管理员充值 200 点不显示」根因与修复方案

### 一、根因（已通过数据库核实）

查询该用户 `07f04ecd-7b1d-441c-8734-a61865f27af0` 实际数据：

| 表 | 实际状态 |
|---|---|
| `user_accounts` | total=300, used=133, remaining=167 ✅（200 点确实加上了） |
| `quota_transactions` | **无 +200 流水**，最早只追溯到 +50 注册赠送 |
| `admin_quota_recharges` | **整表为空**（包括所有用户） |
| `subscriptions` | 无管理员充值审计 |

结论：这 200 点**不是通过新版 `admin-recharge` 边缘函数加的**，而是早期通过旧管理员接口或直接 SQL 改 `user_accounts.total_quota` 加上的。新版 RPC `admin_apply_quota_recharge` 同样**没有写 `quota_transactions` 流水**，所以即使后续走新接口，充值 tab 也看不到。

这是两个独立问题：
- **历史问题**：那 200 点没流水可显示
- **未来问题**：新版充值 RPC 也没写 `quota_transactions`，下一次管理员充值同样不会出现在前端列表

### 二、修复方案

#### 修复 1：补一条 +200 历史流水（数据回填）
为用户 `07f04ecd-7b1d-441c-8734-a61865f27af0` 在 `quota_transactions` 插入 1 条历史补偿记录：
- `type = 'recharge'`
- `amount = 200`
- `balance_after = 167`（当前实际剩余）
- `source = 'admin_recharge'`
- `description = '管理员赠送 +200 点（历史补录）'`
- `created_at` 取一个合理时间（早于本月最早扣费记录的时间，例如 2026-03-12 注册赠送之后、3-13 首次扣费之前）

不动 `user_accounts` 余额（已正确）。

#### 修复 2：让未来的管理员充值自动写流水
更新数据库函数 `admin_apply_quota_recharge`，在 `UPDATE user_accounts` 之后、回填 `admin_quota_recharges` 之前增加：

```sql
INSERT INTO public.quota_transactions (
  user_id, type, amount, balance_after,
  source, description, reference_id
) VALUES (
  p_target_user_id,
  'recharge',
  p_quantity,
  v_new_remaining,
  'admin_recharge',
  '管理员赠送 +' || p_quantity || '点'
    || COALESCE(' (' || p_notes || ')', ''),
  p_request_id
);
```

幂等性已由外层 `admin_quota_recharges.request_id` 唯一约束 + `FOR UPDATE` 锁保证，不会重复写。

#### 修复 3（可选小调整）：排查老路径
搜索代码确认是否还有**绕过 `admin-recharge` 边缘函数、直接改 `user_accounts.total_quota`** 的旧管理员入口；若有就让它统一走新 RPC，避免再次出现"加了点但没流水"。

### 三、不变的部分
- `user_accounts` 余额计算
- 前端 `VoiceUsageSection.tsx`（充值 tab 已正确按 `type='recharge'` 过滤显示，本身没问题）
- 聚合工具 / 扣费链路

### 四、涉及文件
1. **新增 migration**：
   - 更新 `admin_apply_quota_recharge` 函数（增加 quota_transactions 写入）
2. **数据回填**：
   - 为 `07f04ecd-7b1d-441c-8734-a61865f27af0` 插入 1 条 +200 历史 recharge 流水
3. **代码排查**：
   - 全局搜索 `admin` + `total_quota` / `user_accounts` 直接更新的位置，统一收口（如发现旧入口）

### 五、验收
1. 用户立即能在「充值」tab 看到「管理员赠送 +200 点（历史补录）」
2. 余额仍为 167，总额度仍为 300，未发生变化
3. 之后任何管理员通过 `/admin` 充值，都会立刻在用户的「充值」tab 出现一条绿色 +N 记录
4. 同一 `request_id` 重复触发，只生成 1 条流水

