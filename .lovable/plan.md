

# 测评历史 → 查看完整结果 & 分享

## 问题

当前历史页只展示摘要（分数 + 维度标签），点击只能展开/折叠维度详情。用户无法：
- 从历史记录进入**完整结果页**（含人格描述、AI 洞察、推荐等）
- 从历史记录直接**分享海报**

## 方案

### 1. 历史记录点击 → 恢复完整结果页

数据库中 `partner_assessment_results` 已存储 `answers`（原始答案）。点击历史记录时，用存储的 `answers` 重新调用 `calculateScore` 即可完整还原 `ScoringResult`（含 `meta`、`primaryPattern` 等），然后切换到 `phase="result"` 展示完整结果页。

**DynamicAssessmentPage.tsx**：
- 新增 `handleViewHistoryRecord(record)` 函数：从 record.answers 重算 score → setResult → setAiInsight(record.ai_insight) → setPhase("result")
- 传递 `onViewRecord` 回调给 `DynamicAssessmentHistory`

**DynamicAssessmentHistory.tsx**：
- 接收 `onViewRecord?: (record) => void` 回调
- SBTI 模式：在展开详情区域底部添加"📤 查看完整结果 & 分享"按钮
- 非 SBTI 模式：整张卡片可点击进入结果页
- 每条记录右侧增加 `Share2` 快捷分享图标（可选，或统一通过完整结果页分享）

### 2. 历史记录卡片视觉优化

SBTI 历史卡片展开区域底部增加一个醒目的 CTA 按钮：
```
┌─────────────────────────────┐
│ 🍺 DRUNK · 酒鬼     42分    │
│ 2025年06月15日 20:00        │
│ ▼ 展开                      │
│ ─────────────────────────── │
│ 📊 维度雷达图               │
│ 📋 维度得分                 │
│ 🧠 AI 洞察                  │
│                             │
│  [📤 查看完整结果 & 分享]    │  ← 新增
└─────────────────────────────┘
```

## 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/dynamic-assessment/DynamicAssessmentHistory.tsx` | 增加 `onViewRecord` prop，展开区域底部加 CTA 按钮 |
| `src/pages/DynamicAssessmentPage.tsx` | 增加 `handleViewHistoryRecord`，从 answers 重算结果并跳转 result 页 |

约 30 行改动，不涉及后端或数据库。

