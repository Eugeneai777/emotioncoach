

# 修复：教练梳理完成后未显示已完成

## 问题分析

数据库中大量日记条目的 `behavior_block` 为 `null`，而前端判断教练梳理是否完成的逻辑是 `!!todayEntry.behavior_block`。这意味着即使教练对话已完成、简报已生成，只要 AI 未填写 `behavior_block` 字段，任务就不会显示为已完成。

**根本原因**: 依赖单一字段 `behavior_block` 来判断教练梳理完成状态不可靠。

## 解决方案

采用双重修复策略：

### 1. 前端：改进完成判定逻辑

**文件: `src/pages/WealthCampCheckIn.tsx`（约第 535 行）**

将 `!!todayEntry.behavior_block` 改为更宽松的判定——只要日记条目中有任意一个梳理内容字段（`behavior_block`、`emotion_block`、`belief_block`、`briefing_content`）不为空，即视为已完成：

```ts
// 改前
setCoachingCompleted(!!todayEntry.behavior_block);

// 改后
const hasCoachingContent = !!(
  todayEntry.behavior_block || 
  todayEntry.emotion_block || 
  todayEntry.belief_block || 
  todayEntry.briefing_content
);
setCoachingCompleted(hasCoachingContent);
```

同时更新 `completedDays` 的计算逻辑（约第 694 行），保持一致：

```ts
// 改前
journalEntries.filter(e => e.behavior_block).map(...)

// 改后  
journalEntries.filter(e => e.behavior_block || e.emotion_block || e.belief_block || e.briefing_content).map(...)
```

### 2. 后端：确保 `behavior_block` 不为空

**文件: `supabase/functions/generate-wealth-journal/index.ts`（约第 67 行）**

当 `behavior_block` 为空但其他字段有值时，生成一个兜底值：

```ts
// 在现有提取逻辑后添加兜底
if (!behaviorBlock && (emotionBlock || beliefBlock)) {
  behaviorBlock = emotionBlock || beliefBlock || '已完成教练梳理';
}
```

### 改动范围

- `src/pages/WealthCampCheckIn.tsx` — 2 处判定逻辑
- `supabase/functions/generate-wealth-journal/index.ts` — 1 处兜底逻辑

