

## 修复：财富觉醒教练通话 3 分钟被切断

### 问题根因

`CoachVoiceChat.tsx` 第 62 行硬编码了默认时长限制：

```typescript
const DEFAULT_MAX_DURATION_MINUTES = 3; // 默认3分钟（未配置时）
```

当 `getMaxDurationForUser()` 在 `package_feature_settings` 表中找不到 `realtime_voice_wealth_assessment` 的配置时（当前确实没有），就回退到 3 分钟限制。

而财富觉醒教练已经通过 `AssessmentVoiceCoach` 组件控制了 5 次免费额度，因此不应该再叠加 3 分钟时长限制。

### 修复方案

**文件 1：`src/components/coach/CoachVoiceChat.tsx`**

在组件 props 中增加可选的 `maxDurationOverride` 属性：

```typescript
interface CoachVoiceChatProps {
  // ... 现有 props
  maxDurationOverride?: number | null; // null = 不限时, number = 指定分钟数
}
```

在 `getMaxDurationForUser` 加载逻辑前，优先使用 override 值：

```typescript
const loadDurationLimit = async () => {
  setIsLoadingDuration(true);
  if (maxDurationOverride !== undefined) {
    setMaxDurationMinutes(maxDurationOverride);
  } else {
    const maxDuration = await getMaxDurationForUser();
    setMaxDurationMinutes(maxDuration);
  }
  setIsLoadingDuration(false);
};
```

**文件 2：`src/components/wealth-block/AssessmentVoiceCoach.tsx`**

在调用 `CoachVoiceChat` 时传入 `maxDurationOverride={null}`（不限时）：

```typescript
<CoachVoiceChat
  // ... 现有 props
  maxDurationOverride={null}  // 免费5次不限时长
/>
```

这样：
- 5 次免费通话不再有 3 分钟限制
- 其他教练的通话逻辑不受影响，仍然走 `package_feature_settings` 查询
- 底部提示文字会自动显示"无限时"而非"最长3分钟"

