

# 修复训练营天数显示两个 Bug

## Bug 1：财富训练营显示 "Day 26/7"

**根因**：`WealthCampCheckIn.tsx` 第 286-289 行，`currentDay` 用 `getDaysSinceStart(camp.start_date) + 1` 计算，这是自然日历天数（开营至今的天数），不封顶。虽然 `CampCheckIn.tsx` 用了 `Math.min(calculatedCurrentDay, camp.duration_days)` 封顶，但 `WealthCampCheckIn.tsx` **没有封顶**，所以传给 `AwakeningDashboard` 和 `CollapsibleProgressCalendar` 的 `currentDay` 可以是 26、30 等超过 7 的值。

**修复**：在 `WealthCampCheckIn.tsx` 第 288 行加封顶：
```typescript
const currentDay = useMemo(() => {
  if (!camp?.start_date) return 1;
  const days = Math.max(1, getDaysSinceStart(camp.start_date) + 1);
  return Math.min(days, camp.duration_days || 7); // 封顶为 7
}, [camp?.start_date, camp?.duration_days]);
```

同时检查 `CollapsibleProgressCalendar.tsx` 第 231 行的 `Day ${currentDay}/${totalDays}` 显示逻辑，确保 `currentDay` 已经是封顶值。

## Bug 2：第 1 天打卡完成后显示"已坚持 0 天"

**根因**：`CampCheckIn.tsx` 第 626 行显示 `camp.completed_days || 0`。打卡通过 `performCheckIn` 更新数据库中的 `completed_days`，然后调用 `loadCampData()` 重新获取数据。但显示用的是 `camp` 状态对象——如果 `loadCampData` 返回的数据没有及时刷新 `camp.completed_days`（例如缓存或 React Query 延迟），就会显示旧值 0。

更本质的问题：`performCheckIn` 在第 159-166 行只有当 `today` 不在 `checkInDates` 中时才更新 `completed_days`。如果用户今天已经触发过一次打卡（重复打卡），`streakDays = camp.completed_days`（不加 1），这时如果初始值是 0 就会一直是 0。

**修复**：
1. 在 `CampCheckIn.tsx` 第 626 行，改用 `check_in_dates` 的长度作为已坚持天数的 fallback：
```typescript
已坚持 {camp.completed_days || checkInDates.length || 0} 天
```

2. 或更彻底：在 `handleCoachingComplete` 成功后，用 `performCheckIn` 返回的 `streakDays` 直接更新显示状态，而不是等待 `loadCampData` 异步刷新。

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/pages/WealthCampCheckIn.tsx` | `currentDay` 加 `Math.min` 封顶 |
| `src/pages/CampCheckIn.tsx` | "已坚持 N 天"改用可靠数据源，打卡后立即更新显示 |

