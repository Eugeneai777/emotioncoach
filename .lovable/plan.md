

# 21天情绪日记训练营：已购用户免支付修复

## 问题分析

`Index.tsx` 页面中的 `StartCampDialog` 配置了 `price: 399`，但**没有传入 `isPurchased` 属性**。对话框内部通过 `useCampPurchase` 仅检查 `user_camp_purchases` 表，而非作为财务事实来源的 `orders` 表。

这导致通过 `synergy_bundle` 购买的用户（订单在 `orders` 表中），可能仍然被要求再次付费。

相比之下，`CampIntro.tsx` 页面已正确实现了基于 `orders` 表的购买检查。

## 改动计划

### 修改 `src/pages/Index.tsx`

1. **新增 orders 表购买状态查询**：使用 `useQuery` 查询 `orders` 表中 `emotion_journal_21` 或 `synergy_bundle` 的 paid 记录（与 CampIntro.tsx 逻辑一致）
2. **传入 `isPurchased` 到 StartCampDialog**：将查询结果作为 `isPurchased` 属性传入
3. 已有活跃训练营（`activeCamp`）的用户不受影响，他们直接进入打卡页

### 技术细节

```typescript
// 新增查询
const { data: journalOrderPurchase } = useQuery({
  queryKey: ['journal-order-purchase', user?.id],
  queryFn: async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .in('package_key', ['synergy_bundle', 'camp-emotion_journal_21'])
      .eq('status', 'paid')
      .limit(1)
      .maybeSingle();
    return data;
  },
  enabled: !!user
});

// 传入 StartCampDialog
<StartCampDialog
  ...
  isPurchased={!!journalOrderPurchase}
/>
```

## 不变项
- CampIntro.tsx 已有正确逻辑，不改动
- 支付流程、训练营创建流程不变
- 未登录用户行为不变

