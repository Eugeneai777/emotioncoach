

# 问题诊断：用户 13548060283 训练营购买后仍显示点数用完

## 根本原因

在 `deduct-quota` 边缘函数中，`checkCampEntitlement` 函数使用了 `.maybeSingle()` 查询 `camp_entitlements` 表。但 `feature_key = 'realtime_voice_emotion'` 在表中有 **两条记录**（分别对应 `emotion_stress_7` 和 `emotion_journal_21`），`.maybeSingle()` 在返回多条结果时会报错，导致查询结果为 `null`，权益检查被跳过。

系统随后按正常流程扣点，而该用户账户余额为 0（总额 200，已用 200），扣费失败，显示"点数用完"。

**前端预检查**（CoachVoiceChat L414-424）只检查是否有活跃训练营，不检查 `camp_entitlements` 表，所以用户能打开语音界面，但在通话过程中第一次扣费就失败。

## 修复方案

### 文件：`supabase/functions/deduct-quota/index.ts`

将 `checkCampEntitlement` 函数中的 `.maybeSingle()` 改为 `.limit(10)`（返回数组），然后遍历所有匹配的 `camp_type`，逐一检查用户是否有对应的购买记录和活跃训练营。只要任一 camp_type 匹配成功，即视为有权益。

```text
当前逻辑（有Bug）:
  camp_entitlements 查 feature_key → .maybeSingle() → 多行报错 → null → 跳过

修复后逻辑:
  camp_entitlements 查 feature_key → 返回数组 → 遍历每个 camp_type
    → 检查 user_camp_purchases 是否有购买
    → 检查 training_camps 是否活跃
    → 任一匹配即返回 hasCampAccess: true
```

### 改动范围
- **仅修改** `supabase/functions/deduct-quota/index.ts` 的 `checkCampEntitlement` 函数（L8-49）
- 不影响任何其他逻辑和功能
- 不影响前端代码

