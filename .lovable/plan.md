

# 财富觉醒训练营天数逻辑修复

## 确认结论

**财富觉醒训练营是 7 天打卡**（`duration_days = 7`，`camp_type = wealth_block_7`）。数据库中所有财富营记录均为 7 天。

## 问题分析

`WealthCampCheckIn.tsx` 中有两个"天数"变量：

- **`currentDay`** = 从 `start_date` 到今天的**自然天数**（可以是 26、50 等任何数字）
- **`displayDay`** = `completed_days + 1`（范围 1-7，基于实际打卡进度）

问题：`currentDay`（自然天数）被大量用于本应使用 `displayDay`（打卡天数）的场景，导致出现 "Day 26" 这样超出 7 天范围的文案。具体受影响的地方：

1. **补卡提示文案**（第 851 行）：`继续完成今日 Day {currentDay}` → 显示 Day 26
2. **日记条目查询**：用 `currentDay` 作为 `day_number` 查 journal entries → 查不到
3. **邀请状态 localStorage key**：用 `currentDay` 构造 key → 每天都是新状态
4. **社区分享状态查询**：用 `currentDay` 作为 `camp_day` → 查不到
5. **打卡追踪**（第 670 行）：`trackDayCheckin(currentDay)` → 记录 Day 26

## 修复方案

**文件**: `src/pages/WealthCampCheckIn.tsx`

1. 将 `currentDay` 限制在 `duration_days` 范围内，或新增 `effectiveDay` 变量：
   ```ts
   const effectiveDay = Math.min(currentDay, camp?.duration_days || 7);
   ```

2. 将所有面向用户展示和日记/分享逻辑中的 `currentDay` 替换为 `effectiveDay`：
   - 补卡文案（第 851 行）
   - `useTodayWealthJournal` 调用（第 468 行）
   - 邀请状态 key（第 482 行）
   - 分享状态查询（第 520 行）
   - 打卡追踪（第 670 行）
   - 补卡范围计算（第 709 行）

3. 保留原始 `currentDay` 仅用于判断营期是否已超时/过期等日历逻辑。

**同时**：修复上一轮发现的 `handleCoachingComplete` 未更新 `completed_days` 的 Bug（增加数据库更新逻辑）。

