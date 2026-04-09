

# 修复"已坚持 0 天"显示问题

## 问题根因

`src/pages/CampCheckIn.tsx` 第 626 行：
```
已坚持 {camp.completed_days || checkInDates.length || 0} 天
```

两个问题叠加：
1. **`||` 是 falsy 判断**：当 `completed_days` 为 `0` 时会 fall through，但 `checkInDates.length` 也为 `0`，最终显示 0。
2. **数据同步延迟**：打卡完成后 `loadCampData()` 异步刷新，UI 可能在新数据回来之前就渲染了"打卡完成"状态，此时 `camp` 仍是旧数据。

## 修改方案（仅改 `src/pages/CampCheckIn.tsx`）

1. **用 `Math.max` 替代 `||` 链**：`Math.max(camp.completed_days, checkInDates.length, allDone ? 1 : 0)` — 取三者最大值，确保打卡完成后至少显示 1。

2. **提取为变量**，避免行内表达式过长，提升可读性。

改动仅涉及第 626 行附近，约 2 行代码。

