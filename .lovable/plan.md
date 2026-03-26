

# 修复 /promo/synergy「进入训练营」跳转到错误训练营的问题

## 问题根因

`handleEnterCamp`（第 433-441 行）查询活跃训练营时，同时匹配了 `emotion_stress_7`、`emotion_journal_21`、`synergy_bundle` 三种类型，按创建时间降序取第一个。该用户同时拥有 21 天情绪日记营（活跃中），导致点击「进入训练营」后跳转到了 21 天营的打卡页。

## 修复方案

**文件**: `src/pages/SynergyPromoPage.tsx` 第 433-448 行

修改 `handleEnterCamp` 的查询逻辑，优先查找 `emotion_stress_7` 营：

```typescript
const handleEnterCamp = async () => {
  if (user) {
    // 优先查找 emotion_stress_7 训练营
    const { data: stressCamp } = await supabase
      .from('training_camps')
      .select('id')
      .eq('user_id', user.id)
      .eq('camp_type', 'emotion_stress_7')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    
    if (stressCamp) {
      navigate(`/camp-checkin/${stressCamp.id}`);
      return;
    }
  }
  // 没有活跃的7天营 → 引导开营
  navigate('/camp-intro/emotion_stress_7');
};
```

## 影响范围

- 仅修改 `handleEnterCamp` 函数中的查询条件
- 不影响支付流程、购买状态检测、其他训练营跳转
- 21 天情绪日记营的正常使用不受影响（用户从其他入口仍可进入）

