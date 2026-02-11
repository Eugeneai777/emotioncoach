

## 防止 subscriptions 记录丢失的系统性修复

### 问题根因

存在三条支付确认路径，它们之间有竞态条件（Race Condition）：

```text
路径 A: wechat-pay-callback（微信异步回调）
路径 B: check-order-status + forceWechatQuery（前端轮询主动查询）
路径 C: alipay-callback（支付宝回调）
```

**竞态场景举例**：
1. 用户支付成功后，前端轮询触发 `check-order-status`（路径 B），主动查微信确认已付，将订单更新为 `paid`，并写入 subscriptions
2. 几秒后微信异步回调 `wechat-pay-callback`（路径 A）到达，发现订单已经是 `paid`，**直接返回**，跳过所有后续处理
3. 如果步骤 1 中 subscriptions 的 upsert 因为任何原因（网络抖动、超时）静默失败，则没有第二次补救机会

反过来也一样：如果回调先到但 upsert 失败，轮询路径发现已 `paid` 就直接返回了。

### 修复方案

**核心思路**：在 `check-order-status` 的"订单已 paid"早返回路径中，增加 subscriptions 完整性检查。如果已付费但缺少 subscription 记录，补充创建。

#### 1. 修改 `check-order-status/index.ts`（主要修复）

在第 170-185 行的 `if (order.status === 'paid')` 分支中，增加逻辑：

```typescript
if (order.status === 'paid') {
  // 检查 subscription 是否存在，不存在则补建
  if (order.user_id && !order.package_key.startsWith('camp-')) {
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', order.user_id)
      .maybeSingle();

    if (!existingSub) {
      // 补建 subscription 记录
      const { data: subPkg } = await supabase
        .from('packages')
        .select('id, duration_days, package_name')
        .eq('package_key', order.package_key)
        .maybeSingle();
      if (subPkg) {
        const startDate = new Date(order.paid_at || new Date());
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (subPkg.duration_days || 365));
        await supabase.from('subscriptions').upsert({
          user_id: order.user_id,
          package_id: subPkg.id,
          subscription_type: order.package_key,
          status: 'active',
          combo_name: subPkg.package_name,
          combo_amount: order.amount,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }, { onConflict: 'user_id' });
        console.log('[CheckOrder] Repaired missing subscription:', order.user_id);
      }
    }
  }
  // 正常返回已付费状态
  return new Response(...);
}
```

#### 2. 修改 `wechat-pay-callback/index.ts`（防御性修复）

在第 110 行的 `if (order.status === 'paid')` 早返回分支中，同样增加 subscription 存在性检查和补建逻辑，确保回调路径也能自愈。

#### 3. 修改 `alipay-callback/index.ts`（一致性）

在第 119 行的 `if (order.status === 'paid')` 分支中添加相同的补建逻辑。

### 修改文件汇总

| 文件 | 改动 |
|------|------|
| `supabase/functions/check-order-status/index.ts` | 已 paid 早返回处增加 subscription 补建 |
| `supabase/functions/wechat-pay-callback/index.ts` | 已 paid 早返回处增加 subscription 补建 |
| `supabase/functions/alipay-callback/index.ts` | 已 paid 早返回处增加 subscription 补建 |

### 预期效果

- 无论哪条路径先到达，都会检查并确保 subscription 记录存在
- 使用 `upsert` + `onConflict: 'user_id'` 保证幂等性，不会重复创建
- 即使某次 upsert 失败，下一次轮询或回调会自动补救
