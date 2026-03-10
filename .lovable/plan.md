

## Problem

`ProductComparisonTable.tsx` renders training camp cards on the `/packages` page but never checks whether the user has already purchased or is actively enrolled in a camp. The button always shows "立即报名" regardless of purchase/enrollment status.

This affects both "有劲训练营" (youjin-camp, lines 389-513) and "绽放训练营" (bloom-camp, lines 793+) sections.

## Fix Plan

### 1. Add user camp purchase + enrollment query in `ProductComparisonTable.tsx`

Add a query that fetches all of the current user's camp purchases and active training camps:

```typescript
const { data: userCampPurchases } = useQuery({
  queryKey: ['user-camp-purchases-packages', user?.id],
  queryFn: async () => {
    if (!user) return { purchases: [], camps: [] };
    const [purchaseRes, campRes] = await Promise.all([
      supabase.from('user_camp_purchases').select('camp_type')
        .eq('user_id', user.id).eq('payment_status', 'completed'),
      supabase.from('training_camps').select('camp_type, status')
        .eq('user_id', user.id).in('status', ['active', 'completed']),
    ]);
    return {
      purchases: purchaseRes.data || [],
      camps: campRes.data || [],
    };
  },
  enabled: !!user && (category === 'youjin-camp' || category === 'bloom-camp'),
});
```

Create a helper to determine camp status:
```typescript
function getCampStatus(campType: string) {
  const purchased = userCampPurchases?.purchases?.some(p => p.camp_type === campType);
  const activeCamp = userCampPurchases?.camps?.find(c => c.camp_type === campType);
  if (activeCamp?.status === 'active') return 'active';
  if (activeCamp?.status === 'completed') return 'completed';
  if (purchased) return 'purchased';
  return 'none';
}
```

### 2. Update youjin-camp card buttons (lines 476-508)

Replace the current button logic with status-aware rendering:
- **`active`**: Show "继续训练 →" button, navigate to `/camp-intro/${camp.camp_type}`
- **`completed`**: Show "已完成 ✅" badge + "查看记录" button
- **`purchased`**: Show "开始训练 →" button, navigate to `/camp-intro/${camp.camp_type}`
- **`none`**: Keep current "立即报名" behavior

### 3. Update bloom-camp card buttons (lines 888-908)

Apply the same status-aware button logic as youjin-camp.

### 4. Handle compatibility mapping

Include the same compatibility logic used elsewhere: `wealth_block_7` also matches `wealth_block_21`, `emotion_journal_21` also matches `synergy_bundle`.

