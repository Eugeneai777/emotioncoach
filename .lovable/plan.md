

## 根因（已确认）

用户 `15608091603` (uid `aa59af73...`) 两笔 `standard_49` 充值订单（10:42 和 10:43）数据库均显示 `paid` + `quota_credited_at` 已设，但 `user_accounts` 余额只有 200 点（= 50 注册赠送 + 150 历史），**没有增加 600 点**。

**直接证据**：edge function log 在 10:43:33 报 `Query user account error: invalid input syntax for type uuid: "null"`——`wechat-pay-callback` 在 line 302 用 `order.user_id = null` 去查 user_accounts，导致后续 `+300 quota` 那段 `else if (userAccount)` 分支根本没进。

**完整链路**：
1. 订单创建为 **guest 模式**（小程序场景下 `create-wechat-order` line 369: `user_id: isGuest ? null : finalUserId`），DB 中 `user_id = null`
2. 用户付款 → `wechat-pay-callback` 被微信调用，select * 拿到 `order.user_id = null`
3. callback line 274 原子 claim 锁成功 → 写入 `quota_credited_at = now()`
4. callback line 302 用 `null` 查 user_accounts → Postgres 返回 22P02 错误
5. line 308-309 仅 `console.error`，**不回滚 quota_credited_at**，也不补发点数
6. 之后 `claim-guest-order` (前端登录后) 把 user_id 回填为真 uuid，但 `quota_credited_at` 已被锁定为已发放，再也不会补点
7. 365 会员充值正常，是因为那次 user 已登录，订单 `user_id` 创建时就是真 uuid，跳过了 guest 分支

**这不是 standard_49 特有问题**——所有"未登录态/小程序 openId 未绑定时"创建的非训练营充值订单都受影响。

---

## 修复方案

### 1. 数据修补（手工补 600 点给该用户）

```sql
UPDATE user_accounts 
SET total_quota = total_quota + 600, updated_at = now() 
WHERE user_id = 'aa59af73-dccb-4532-8e9b-5a9acea7480a';

INSERT INTO quota_transactions (user_id, type, amount, balance_after, source, description, reference_id)
VALUES 
  ('aa59af73-dccb-4532-8e9b-5a9acea7480a','recharge',300,500,'order','补发：标准会员充值 +300','<order_id_VSEYZ2>'),
  ('aa59af73-dccb-4532-8e9b-5a9acea7480a','recharge',300,800,'order','补发：标准会员充值 +300','<order_id_K4QXHZ>');
```

### 2. 代码加固（3 处 edge function 同步修复）

涉及文件：
- `supabase/functions/wechat-pay-callback/index.ts`
- `supabase/functions/check-order-status/index.ts`
- `supabase/functions/alipay-callback/index.ts`

**修改 A：claim 前先校验 user_id，缺失时按 openid 回填**

在每处 "claim quota" 代码（callback line 272-274、check-order-status line 248/398-400）之前加入：

```ts
// user_id 缺失时尝试通过 openid 回填
if (!order.user_id) {
  const openid = paymentData?.payer?.openid; // callback
  // 或 wechatResult?.payer_openid; (check-order-status)
  if (openid) {
    const { data: mapping } = await supabase
      .from('wechat_user_mappings')
      .select('system_user_id')
      .eq('openid', openid)
      .maybeSingle();
    if (mapping?.system_user_id) {
      await supabase.from('orders')
        .update({ user_id: mapping.system_user_id })
        .eq('id', order.id);
      order.user_id = mapping.system_user_id;
    }
  }
}
// 仍无 user_id 则跳过点数发放（不锁 quota_credited_at），等 claim-guest-order 走完整路径
if (!order.user_id) {
  console.warn('[Callback] Skip quota credit: no user_id yet for', orderNo);
  return new Response(JSON.stringify({ code:'SUCCESS', message:'成功' }), { headers:{...} });
}
```

**修改 B：账户查询/更新失败时强制回滚 claim 锁**

把 line 308-309 改为：
```ts
if (accountError) {
  console.error('Query user account error:', accountError);
  await supabase.from('orders').update({ quota_credited_at: null }).eq('id', order.id);
}
```
同样修复 check-order-status 的两处自愈与主路径中"`if (ua)`"分支为空时的兜底，确保只要点数没真发出去就回滚锁。

**修改 C：发点数后写 `quota_transactions` 流水**（与 365 会员一致，方便审计与"点数明细"展示）

```ts
await supabase.from('quota_transactions').insert({
  user_id: order.user_id,
  type: 'recharge',
  amount: quota,
  balance_after: newTotalQuota,
  source: 'order',
  description: `${order.package_name} 充值 +${quota}`,
  reference_id: order.id,
});
```

### 3. `claim-guest-order` 同步加固

回填 user_id 时若发现 `quota_credited_at` 已设但**不存在对应 quota_transactions 流水**，视为"伪发放"，重置 `quota_credited_at = null` 并触发自愈。

---

## 技术细节

| 文件 | 改动点 | 行号 |
|---|---|---|
| `wechat-pay-callback/index.ts` | A: claim 前回填 user_id；B: error 路径回滚 quota_credited_at；C: 写 quota_transactions | ~270-330 |
| `check-order-status/index.ts` | 同 A/B/C，覆盖主路径(398-446)和自愈路径(247-296) | 247-296, 398-446 |
| `alipay-callback/index.ts` | 同 A/B/C | 类似位置 |
| `claim-guest-order/index.ts` | 检测 quota_credited_at vs quota_transactions 不一致，触发补发 | line 259+ |
| 数据库 | 直接 SQL 给该用户补 600 点 + 补 2 条 quota_transactions | - |

回归测试要点：
- 登录态用户充值 standard_49 → 立即 +300，明细出现 1 条流水
- 微信小程序 guest 模式（未绑定 openid）充值 → quota_credited_at 不被错误锁定，登录后 claim-guest-order 能正确补发
- 同一用户连续两次充值 → 各自 +300，共 600

