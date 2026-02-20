
# 修复：绽放合伙人用户不显示邀请码入口

## 问题分析

邀请码入口（`BloomInviteCodeEntry`）的显示条件是：
```
isLoggedIn && !hasPurchased && !isLoading
```

`hasPurchased` 仅检查 `orders` 表中是否存在 `wealth_block_assessment` 的已支付记录。

**漏洞场景**：用户已经是绽放合伙人（`partners` 表中存在 `partner_type = 'bloom'` 的记录），但由于数据同步时序或其他原因，`orders` 表中的记录尚未写入或被查询到，此时 `hasPurchased = false`，邀请码框依然显示，造成困惑。

此外，即使权益已完整发放，对一个**已经是绽放合伙人的用户**展示"我有邀请码"入口在语义上是多余的——他们已经完成了整个领取流程。

## 修复方案

### 修改 1：`src/pages/WealthBlockAssessment.tsx`

在已有的 `useAssessmentPurchase` 基础上，增加对 `partners` 表的查询，判断用户是否已经是绽放合伙人：

```typescript
// 新增：检查用户是否已是绽放合伙人
const { data: bloomPartnerRecord } = useQuery({
  queryKey: ['bloom-partner-check', user?.id],
  queryFn: async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .eq('partner_type', 'bloom')
      .maybeSingle();
    return data;
  },
  enabled: !!user
});

const isBloomPartner = !!bloomPartnerRecord;
```

然后将 `isBloomPartner` 传入 `AssessmentIntroCard`：
```tsx
<AssessmentIntroCard
  isLoggedIn={!!user}
  hasPurchased={hasPurchased}
  isBloomPartner={isBloomPartner}  // 新增
  isLoading={false}
  ...
/>
```

### 修改 2：`src/components/wealth-block/AssessmentIntroCard.tsx`

1. 在 `AssessmentIntroCardProps` 接口增加 `isBloomPartner?: boolean`
2. 将邀请码显示条件修改为：

```tsx
{/* 邀请码兑换入口 - 已登录、未购买、非绽放合伙人、且加载完成 */}
{isLoggedIn && !hasPurchased && !isBloomPartner && !isLoading && (
  <BloomInviteCodeEntry variant="card" onSuccess={onStart} />
)}
```

## 修改影响范围

- 仅修改 2 个文件：`WealthBlockAssessment.tsx`、`AssessmentIntroCard.tsx`
- 不影响普通付费用户、未登录用户的任何逻辑
- 绽放合伙人（`partner_type = 'bloom'`）将**永远不再看到**邀请码入口，无论 `orders` 表数据是否同步

## 技术细节

```text
现有逻辑：
显示邀请码 = 已登录 AND 未购买(orders表) AND 加载完成

修复后：
显示邀请码 = 已登录 AND 未购买(orders表) AND 非绽放合伙人(partners表) AND 加载完成
```

`partners` 表的查询开销极小（按 `user_id` 索引），不会对页面性能产生影响。
