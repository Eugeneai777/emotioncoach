

# 将"AI陪伴对话"改为"AI情绪健康教练"

## 分析结果

根据搜索结果，需要修改以下文件中的相关术语：

| 文件 | 当前文案 | 修改为 |
|------|----------|--------|
| `src/pages/AssessmentCoachPage.tsx` | "AI陪伴对话" (标题/meta) | "AI情绪健康教练" |
| `src/components/emotion-health/emotionHealthData.ts` | "AI教练陪伴对话"、"开始我的AI陪伴对话" | "AI情绪健康教练" |
| `src/config/growthPathConfig.ts` | "AI对话陪伴" (description) | "AI情绪健康教练" |

以下文件使用的是更通用的"AI陪伴"术语（非本次修改目标，但可选择性统一）：
- 分享卡片中的"温暖AI陪伴"
- 训练营描述中的"AI陪伴"标签
- 其他产品对比表格中的标签

## 修改方案

### 文件1: `src/pages/AssessmentCoachPage.tsx`

```text
修改点：
- Line 38: <title>AI陪伴对话 - 有劲AI</title>
  → <title>AI情绪健康教练 - 有劲AI</title>

- Line 39: <meta name="description" content="根据你的情绪状态，开始个性化的AI陪伴对话" />
  → <meta name="description" content="根据你的情绪状态，开启专属的AI情绪健康教练对话" />

- Line 42: <PageHeader title="AI陪伴对话" showBack />
  → <PageHeader title="AI情绪健康教练" showBack />
```

### 文件2: `src/components/emotion-health/emotionHealthData.ts`

```text
修改点：
- Line 202: { icon: 'Bot', title: "AI教练陪伴", desc: "根据结果进入专属对话修复路径", color: "emerald" }
  → { icon: 'Bot', title: "AI情绪健康教练", desc: "根据结果进入专属对话修复路径", color: "emerald" }

- Line 226: "AI教练陪伴对话"
  → "AI情绪健康教练"

- Line 233: "获得AI教练个性化陪伴"
  → "获得AI情绪健康教练对话"

- Line 608: ctaText: '开始我的AI陪伴对话'
  → ctaText: '开始AI情绪健康教练'
```

### 文件3: `src/config/growthPathConfig.ts`

```text
修改点：
- Line 38: description: '基于测评结果的个性化AI对话陪伴'
  → description: '基于测评结果的AI情绪健康教练'
```

## 预期效果

| 位置 | 修改前 | 修改后 |
|------|--------|--------|
| 测评后AI对话页标题 | AI陪伴对话 | AI情绪健康教练 |
| 测评结果页CTA | 开始我的AI陪伴对话 | 开始AI情绪健康教练 |
| 成长路径页描述 | AI对话陪伴 | AI情绪健康教练 |
| 测评介绍页功能列表 | AI教练陪伴/AI教练陪伴对话 | AI情绪健康教练 |

