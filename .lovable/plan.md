

## 修复支付回调缺失 subscriptions 写入的问题

### 问题根因

支付成功后有 3 条回调路径，**全部缺少 `subscriptions` 表的写入**：

| 回调路径 | 写 orders | 写 user_accounts | 写 subscriptions | 写 camp_purchases |
|---------|----------|-----------------|-----------------|------------------|
| `wechat-pay-callback` | OK | OK | **缺失** | OK |
| `alipay-callback` | OK | OK | **缺失** | 未处理 |
| `check-order-status` (forceWechatQuery) | OK | **缺失** | **缺失** | **缺失** |

这导致用户（如张艳）付款成功后，`subscriptions` 表无记录，`assessment-emotion-coach` 检查权限时认为用户无有效订阅，触发了 402 付费弹窗。

### 修复方案

#### 方案：抽取统一的"支付成功后处理"逻辑，三个回调共用

将 `wechat-pay-callback` 中现有的后处理逻辑（配额、训练营、合伙人等）提炼为一个内部函数 `processOrderPostPayment`，并**新增 `subscriptions` 写入**，然后让三个回调路径统一调用。

---

### 具体修改

#### 文件 1：`supabase/functions/wechat-pay-callback/index.ts`

在现有的配额更新逻辑之后（约第 196 行），新增 subscriptions 写入：

```text
// 在 user_accounts 配额更新之后，新增 subscriptions 写入
const { data: pkg } = await supabase
  .from('packages')
  .select('id, duration_days')
  .eq('package_key', order.package_key)
  .maybeSingle();

if (pkg) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (pkg.duration_days || 365));

  await supabase.from('subscriptions').upsert({
    user_id: order.user_id,
    package_id: pkg.id,
    status: 'active',
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    payment_amount: order.amount,
  }, { onConflict: 'user_id,package_id' });
}
```

要点：
- 使用 `upsert` 避免重复创建（如果已存在则更新）
- 查询 `packages` 表获取 `duration_days` 和 `package_id`
- 仅对非训练营订单创建（训练营走 `user_camp_purchases`）

#### 文件 2：`supabase/functions/alipay-callback/index.ts`

同样在配额更新之后新增 subscriptions 写入逻辑（与 wechat-pay-callback 一致）。同时补充训练营和合伙人的处理逻辑（目前完全缺失）。

#### 文件 3：`supabase/functions/check-order-status/index.ts`

这是最严重的遗漏 -- `forceWechatQuery` 确认支付成功后，仅更新了 `orders.status`，完全没有执行后续权益发放。

修复方案：当 `forceWechatQuery` 确认支付成功时，调用 `wechat-pay-callback` 的完整后处理逻辑。实现方式为通过 `supabase.functions.invoke('wechat-pay-callback-process')` 或直接在 `check-order-status` 中内联后处理逻辑。

考虑到代码维护性，最佳方案是：`check-order-status` 在更新订单状态后，**模拟调用 `wechat-pay-callback` 的逻辑**。具体做法是将后处理逻辑复制到 `check-order-status` 中（包括配额更新、subscriptions 创建、训练营、合伙人等）。

```text
// check-order-status forceWechatQuery 确认支付后，新增：
// 1. 查询完整订单信息
const { data: fullOrder } = await supabase
  .from('orders')
  .select('*')
  .eq('order_no', orderNo)
  .single();

// 2. 训练营处理
if (fullOrder.package_key.startsWith('camp-')) { ... }

// 3. 配额更新
else { ... update user_accounts ... }

// 4. 创建 subscriptions（新增）
// 5. 合伙人处理
// 6. 佣金计算
```

### 数据库

需确认 `subscriptions` 表是否有 `(user_id, package_id)` 的唯一约束，以支持 `upsert`。如果没有，改用先查询再 insert/update 的方式。

### 修改文件清单

| 文件 | 改动 |
|------|------|
| `supabase/functions/wechat-pay-callback/index.ts` | 在配额更新后新增 subscriptions 写入 |
| `supabase/functions/alipay-callback/index.ts` | 新增 subscriptions 写入 + 补充训练营/合伙人处理 |
| `supabase/functions/check-order-status/index.ts` | forceWechatQuery 成功后新增完整的权益发放逻辑 |

### 紧急修复：为张艳补充订阅

在代码修复部署前，需要手动为张艳补充 subscriptions 记录。可以通过后台管理页面或直接在数据库中插入：

```sql
-- 需要先查询 packages 表获取对应的 package_id
INSERT INTO subscriptions (user_id, package_id, status, start_date, end_date, payment_amount)
VALUES ('张艳的user_id', '对应package_id', 'active', '2026-02-08', '2027-02-08', 365);
```

### 预期效果

- 所有支付回调路径（微信回调、支付宝回调、主动查询确认）都会正确创建 subscriptions 记录
- 用户付款后立即获得完整权益，不再被误触付费弹窗
- `forceWechatQuery` 路径不再只改状态不发权益

