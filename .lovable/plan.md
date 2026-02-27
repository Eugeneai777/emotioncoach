

# 简化 /parent-diary 页面

## 当前问题

页面共 599 行，5 个 Tab，功能重复严重：

| 问题 | 详情 |
|------|------|
| Tab 过多 | 5 个 Tab（简报/趋势/洞察/对比/复盘），其中趋势、对比、复盘功能高度重叠 |
| "简报"Tab 塞太多 | CommunicationProgressCurve + TeenUsageStats + UnifiedEmotionHeatmap + 列表，杂乱 |
| Session 详情内联 | 200 行详情视图直接写在页面组件里，臃肿 |
| 导入爆炸 | 30+ 行 import，很多组件只在一个 Tab 里用 |

## 简化方案

### 1. 合并为 3 个 Tab

- **简报** — 简报列表（核心功能）
- **趋势** — 合并热力图 + 标签云 + 周期分析
- **洞察** — 合并 PatternInsights + EmotionReview（去掉独立的"对比"和"复盘"Tab）

### 2. 提取 Session 详情为独立组件

新建 `src/components/parentDiary/ParentSessionDetail.tsx`，将 190-386 行的详情视图提取出来，页面从 ~600 行减到 ~300 行。

### 3. 精简"简报"Tab

移除嵌在列表 Tab 里的 CommunicationProgressCurve 和 TeenUsageStats（这些属于趋势/分析，不属于简报列表），只保留列表本身。将 UnifiedEmotionHeatmap 移到"趋势"Tab。

### 4. 去掉"对比"Tab

ParentSessionComparison 使用率低且与"复盘"功能重叠，直接移除。

## 文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `src/components/parentDiary/ParentSessionDetail.tsx` | 提取 session 详情视图 |
| 修改 | `src/pages/ParentChildDiary.tsx` | 合并 Tab、精简导入、引用新组件 |

## 简化后结构

```text
Tab 1: 简报（列表）
  - 筛选标签
  - 简报卡片列表

Tab 2: 趋势
  - UnifiedEmotionHeatmap
  - ParentEmotionTagCloud
  - ParentCycleAnalysis

Tab 3: 洞察
  - ParentPatternInsights
  - ParentEmotionReview
```

页面预计从 599 行减少到约 250 行。

