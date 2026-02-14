

## 绽放合伙人完成测评后登录跳转财富教练页

### 需求
绽放合伙人**完成财富卡点测评后**，每次登录自动跳转到 `/coach/wealth_coach_4_questions`。未完成测评的合伙人保持原有跳转逻辑。

### 判断条件
需要同时满足两个条件：
1. 用户是活跃绽放合伙人（`partners` 表中 `partner_type = 'bloom'` 且 `status = 'active'`）
2. 用户已完成财富卡点测评（`orders` 表中有 `package_key = 'wealth_block_assessment'` 且 `status = 'paid'` 的记录）

### 改动内容

**文件：`src/pages/Auth.tsx`**（第 219-233 行）

在 `preferred_coach === 'wealth'` 分支中，在检查活跃训练营**之前**，先检查是否是已完成测评的绽放合伙人：

```text
if preferred_coach === 'wealth':
  1. 查 partners 表：是否是活跃绽放合伙人
  2. 查 orders 表：是否已完成财富卡点测评（paid 订单）
  3. 两者都满足 -> 跳转 /coach/wealth_coach_4_questions
  4. 否则 -> 保持原逻辑（检查活跃训练营 / 教练介绍页）
```

具体代码（插入到第 219 行 `if (profile?.preferred_coach === 'wealth')` 之后）：

```typescript
// 检查是否是已完成测评的绽放合伙人
const [{ data: bloomPartner }, { data: assessmentOrder }] = await Promise.all([
  supabase.from('partners').select('id')
    .eq('user_id', session.user.id)
    .eq('partner_type', 'bloom')
    .eq('status', 'active')
    .maybeSingle(),
  supabase.from('orders').select('id')
    .eq('user_id', session.user.id)
    .eq('package_key', 'wealth_block_assessment')
    .eq('status', 'paid')
    .maybeSingle()
]);

if (bloomPartner && assessmentOrder) {
  targetRedirect = "/coach/wealth_coach_4_questions";
} else {
  // 原有训练营检查逻辑保持不变
}
```

改动量：约 15 行代码，仅修改 `Auth.tsx` 一个文件。使用 `Promise.all` 并行查询避免增加延迟。

