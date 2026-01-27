

# 点击训练营CTA直接进入购买流程

## 问题分析

当前在 `AssessmentCoachChat.tsx` 中：

```typescript
const handleCTAClick = (type: 'camp' | 'membership') => {
  if (type === 'camp') {
    onComplete?.('camp');
    navigate('/camps/emotion');  // ❌ 跳转到训练营列表页
  }
  // ...
};
```

用户点击CTA后被导航到 `/camps/emotion`（训练营列表页），而不是直接进入21天情绪日记训练营的购买页面。

## 解决方案

修改 `handleCTAClick` 逻辑，直接导航到 `/camp-intro/emotion_journal_21` 页面，这个页面已经包含了完整的购买流程（价格展示 + 微信支付弹窗）。

## 修改内容

**文件：`src/components/emotion-health/AssessmentCoachChat.tsx`**

```typescript
// 修改前（第222-230行）
const handleCTAClick = (type: 'camp' | 'membership') => {
  if (type === 'camp') {
    onComplete?.('camp');
    navigate('/camps/emotion');  // 跳转到列表页
  } else if (type === 'membership') {
    onComplete?.('membership');
    navigate('/packages');
  }
};

// 修改后
const handleCTAClick = (type: 'camp' | 'membership') => {
  if (type === 'camp') {
    onComplete?.('camp');
    // 直接跳转到21天情绪日记训练营介绍&购买页
    navigate('/camp-intro/emotion_journal_21');
  } else if (type === 'membership') {
    onComplete?.('membership');
    navigate('/packages');
  }
};
```

## 修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/components/emotion-health/AssessmentCoachChat.tsx` | 将 `navigate('/camps/emotion')` 改为 `navigate('/camp-intro/emotion_journal_21')` |

## 用户体验流程

```text
AI教练对话（4轮后）
    ↓
AI自然提及"21天情绪日记训练营"
    ↓
显示柔和CTA卡片
    ↓
用户点击「了解详情」
    ↓
直接进入 /camp-intro/emotion_journal_21 
（展示完整介绍 + 价格 + 立即购买按钮）
    ↓
点击购买 → 微信支付弹窗
    ↓
支付成功 → 选择开始日期 → 进入训练营
```

## 预期效果

- 点击CTA直接进入21天情绪日记训练营详情页
- 详情页已有完整的价格展示（¥299）和购买按钮
- 购买流程无缝衔接，减少用户流失

