
# 修复觉醒指数图表：与财富简报天数和数据同步

## 问题诊断

### 根本原因

当前图表数据与财富简报不同步，有两个层面的问题：

**问题 1：排序不一致**

- `useWealthJournalEntries` 查询时用 `.order('day_number', { ascending: true })` 排序
- 财富简报的 `journalSequenceMap` 用 `created_at` 升序排列后分配序号
- 图表的 `chartData` 也用 `created_at` 排列，但数据来源是 `day_number` 排序的 entries，如果 `day_number` 顺序与 `created_at` 顺序不一致（例如补卡），序号会对不上

**问题 2：数据源不完整**

- 图表只使用 `wealth_journal_entries`（语音梳理来源）
- 财富简报同时包含 `wealth_journal_entries` + `wealth_coach_4_questions_briefings`（文字梳理）
- 如果用户做过文字梳理，简报里有第 N 天的记录，但图表里没有对应数据点

**结论：** 图表里的"第 1 天、第 2 天"序号与简报里的"第 1 天、第 2 天"不一致

---

## 解决方案

### 核心思路：让图表使用与财富简报完全相同的数据源和排序逻辑

**简报的天数逻辑（在 `WealthCampCheckIn.tsx`）：**
```
journalSequenceMap = 
  mergedBriefings（journal + coach_briefing 混合）
  → 仅筛选 journal 条目
  → 按 created_at 升序
  → 依次分配序号 1, 2, 3...
```

**图表应采用的逻辑（同步）：**
```
chartData = 
  wealth_journal_entries（所有来源）
  → 按 created_at 升序
  → 依次分配序号 1, 2, 3...（与简报完全一致）
  → 第 0 天 = 测评基准
```

注意：觉醒指数只能从 `wealth_journal_entries` 计算（因为 `wealth_coach_4_questions_briefings` 没有行为/情绪/信念评分），但**序号分配**必须与简报一致。

---

## 修改文件

### 1. `src/hooks/useWealthJournalEntries.ts`

**将查询排序从 `day_number` 改为 `created_at`**，确保图表数据与简报的排序基准一致：

```typescript
// 修改前
.order('day_number', { ascending: true });

// 修改后
.order('created_at', { ascending: true });
```

### 2. `src/components/wealth-camp/WealthProgressChart.tsx`

图表的 `chartData` 已经用 `created_at` 升序排列（上一次实现），但由于数据来源排序是 `day_number`，可能导致二次排序时行为异常。

在 `chartData` 的 `useMemo` 中，**明确再次用 `created_at` 排序**（防御性编程），保证无论数据传入顺序如何，图表序号都正确：

```typescript
// 已有（维持不变），但加注释强调排序对齐
const sorted = [...entries].sort((a, b) =>
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
);
```

这部分代码已正确，无需改动。

### 3. `src/components/wealth-camp/AwakeningArchiveTab.tsx`

目前 `fullEntries` 来自 `useWealthJournalEntries({ campId })`，修改 hook 排序后天然同步，无需额外改动。

---

## 最终效果对比

**修改前（不同步）：**
```
财富简报：
  第 1 天（created_at: 2/10）→ 语音梳理
  第 2 天（created_at: 2/12）→ 文字梳理（无分数，不计入图表）
  第 3 天（created_at: 2/14）→ 语音梳理

图表显示：
  第 0 天（起点）→ 45
  第 1 天（day_number=1）→ 52  ← 可能与简报第1天对不上
  第 2 天（day_number=3）→ 61  ← 简报里是第3天，图表显示第2天
```

**修改后（同步）：**
```
财富简报：
  第 1 天（created_at: 2/10）→ 语音梳理 → 有分数
  第 2 天（created_at: 2/12）→ 文字梳理 → 无分数（简报显示第2天，图表第2天为空/0）
  第 3 天（created_at: 2/14）→ 语音梳理 → 有分数

图表显示（created_at 升序）：
  第 0 天（起点）→ 45
  第 1 天（created_at: 2/10）→ 52  ← 与简报第1天一致 ✅
  第 2 天（created_at: 2/12）→ 0   ← 文字梳理无分，图表断点（符合预期）
  第 3 天（created_at: 2/14）→ 61  ← 与简报第3天一致 ✅
```

---

## 技术细节

### 为什么不把文字梳理也加入图表？

`wealth_coach_4_questions_briefings` 表没有 `behavior_score`、`emotion_score`、`belief_score` 字段，无法计算觉醒指数。图表天数序号应当与简报一致，但分数数据只来自 `wealth_journal_entries`。

### 只需改一行

真正的核心修改只在 `useWealthJournalEntries.ts` 第 87 行：
```
.order('day_number', ...) → .order('created_at', ...)
```

这一行修改让数据源的排序与财富简报完全一致，图表中 `chartData` 已有 `created_at` 二次排序，所以两者序号将天然对齐。
