

# SBTI 测评详情页分享海报支持

## 问题

点击 SBTI 详情页（`/assessment/sbti_personality`）的分享按钮时，`AssessmentPromoShareDialog` 因 `ASSESSMENT_PROMO_CONFIGS` 中没有 `sbti_personality` 配置而返回 `null`，海报不会生成。

## 方案

只需在 `AssessmentPromoShareCard.tsx` 的 `ASSESSMENT_PROMO_CONFIGS` 中新增 `sbti_personality` 配置即可。现有的分享链路（`ShareDialogBase` → html2canvas → `ShareImagePreview` 长按保存）已在全平台（小程序/移动端/PC）验证过，无需改动。

### 改动内容

**文件：`src/components/dynamic-assessment/AssessmentPromoShareCard.tsx`**

在 `ASSESSMENT_PROMO_CONFIGS` 中新增：

```typescript
sbti_personality: {
  emoji: '🧠',
  title: 'SBTI人格测评',
  subtitle: '全网爆火！3分钟测出你的搞钱人格',
  highlights: [
    { icon: '🎭', text: '27种搞钱人格，总有一款是你' },
    { icon: '📊', text: '15维度深度扫描你的金钱性格' },
    { icon: '😂', text: '自嘲式解读，扎心但治愈' },
  ],
  gradient: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f59e0b 100%)',
  accentColor: '#7c3aed',
  sharePath: '/assessment/sbti_personality',
  tagline: '有劲AI · 测测你是哪种搞钱人格',
},
```

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/dynamic-assessment/AssessmentPromoShareCard.tsx` | 新增 `sbti_personality` 配置项 |

一处改动，无需登录即可生成海报，全平台兼容。

