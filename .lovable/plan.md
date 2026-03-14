

## 修改计划

两处"Day 24"都因为使用了日历天数 `currentDay`（从 start_date 算起的天数）而非 `displayDay`（`completed_days + 1`）。

### 文件：`src/pages/WealthCampCheckIn.tsx`

**修改 1 — 第 987 行**：教练对话 Tab 中传给 `WealthCoachEmbedded` 的 `dayNumber`
```ts
// 之前
dayNumber={makeupDayNumber || currentDay}
// 之后
dayNumber={makeupDayNumber || displayDay}
```
→ 修复教练头部 "Day 24 · 冥想梳理" → 显示 "Day 3 · 冥想梳理"

**修改 2 — 第 626 行**：`getMeditationContext` 函数中的默认天数
```ts
// 之前
const dayToUse = targetDay || currentDay;
// 之后
const dayToUse = targetDay || displayDay;
```
→ 修复绿色气泡 "今日冥想 · Day 24" → 显示 "今日冥想 · Day 3"

这样两处都会显示 `completed_days + 1`（已完成天数+1），与用户期望一致。

