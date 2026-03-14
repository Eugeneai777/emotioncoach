

## 修改计划

两个问题的根因相同：显示天数时缺少 `+ 1`。

### 问题 1：TrainingCampCard "第24天" → 应显示 `completed_days + 1`
**文件**：`src/components/camp/TrainingCampCard.tsx` 第 94-95 行

当前用日历天数（`getDaysSinceStart + 1`），应改为 `camp.completed_days + 1`。

### 问题 2：WealthTrilogyCard "Day 0" → 应显示 `completed_days + 1`
**文件**：`src/hooks/useTrilogyProgress.ts` 第 43、46 行

当前 `currentDay: camp.completed_days`，改为 `currentDay: camp.completed_days + 1`。

这样两处都统一为"已完成天数 + 1"逻辑。

