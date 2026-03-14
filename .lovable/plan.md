

## 问题分析

用户报告了 3 个页面上的多个天数计算错误：

---

### 问题 1：训练营卡片显示"第7天"（应为第24天）
**文件**：`src/components/camp/TrainingCampCard.tsx` 第 95 行
**原因**：`Math.min(calculatedCurrentDay, camp.duration_days)` 将天数上限锁死为 `duration_days`（7），实际应该显示从 `start_date` 到今天的真实天数。
**修复**：移除 `Math.min`，直接使用 `calculatedCurrentDay`。

同样的问题在 `TrainingCampDetail.tsx` 第 23 行。

---

### 问题 2：Step 2 觉醒旁显示"Day 0"（应为已完成天数，如 Day 3）
**文件**：`src/hooks/useTrilogyProgress.ts` 第 40-46 行
**原因**：
1. 判断完成状态使用 `milestone_21_completed`，但财富营是 7 天营，该字段永远为 `false`，导致已毕业的营无法识别为 `completed`。
2. `currentDay` 使用数据库的 `current_day` 字段（静态值），而非 `completed_days`（已完成打卡天数）。

**修复**：
- 额外查询 `completed_days`、`start_date`、`camp_type`、`duration_days`
- 对于 7 天营，如果 `status === 'completed'`，返回 `completed` 状态
- `currentDay` 使用 `completed_days` 而非 `current_day`

同时修改 `WealthTrilogyCard.tsx` 第 74 行显示逻辑：已完成训练营显示"Day {completedDays}"，活跃训练营也显示已完成天数。

第三张图片（/camp-intro 页面的 Day 0）也来自同一个 `useTrilogyProgress` hook。

---

### 问题 3：打卡页冥想显示问题
**文件**：`src/pages/WealthCampCheckIn.tsx`

**3a. 右上角显示"3 已完成"但音频是第1天内容**
- 第 769 行右上角显示 `camp.completed_days`（3），这个正确
- 第 874 行传给冥想播放器的 `dayNumber={displayDay}`，而 `displayDay = makeupDayNumber || currentDay`
- `currentDay` = `getDaysSinceStart(start_date) + 1` = 24（从开营日起算的天数）
- `meditationDayNumber` = `((24-1) % 7) + 1` = 3，从数据库取第3天冥想
- 但用户说显示第1天内容 → 可能是 `meditationDayNumber` 计算或数据库查询的问题，需要确认

**用户期望**：音频内容应该是"已完成天数+1"=第4天的冥想

**3b. "今日冥想 · Day 22"应该显示对应的冥想内容天数**
- 第 380 行显示 `Day {dayNumber}`，这里 `dayNumber = displayDay = currentDay`（24天），但截图显示 Day 22
- 用户认为应该和音频内容天数对应（如 Day 4）

**修复方案**：
- 冥想内容天数应基于 `completed_days + 1`（下一个要做的天数），而非日历天数
- 冥想播放器的 `dayNumber` 传入 `meditationDayNumber`（实际冥想日 1-7 循环），而非 `displayDay`（日历天数）
- 或者更好的方案：传入 `completed_days + 1` 作为显示天数，冥想内容使用 `((completed_days) % 7) + 1` 来循环

---

## 修改计划

### 1. `src/components/camp/TrainingCampCard.tsx`
- 第 95 行：`displayCurrentDay = calculatedCurrentDay`（移除 Math.min 上限）

### 2. `src/components/camp/TrainingCampDetail.tsx`
- 第 23 行：同样移除 Math.min 上限

### 3. `src/hooks/useTrilogyProgress.ts`
- 修改 camp 查询：增加 `completed_days`、`camp_type`、`duration_days` 字段
- 判断 completed 状态：除了 `milestone_21_completed`，也检测 `status === 'completed'`
- `currentDay` 使用 `completed_days` 代替 `current_day`

### 4. `src/pages/WealthCampCheckIn.tsx`
- 冥想内容天数改为基于 `completed_days`：`nextMeditationDay = ((camp.completed_days) % 7) + 1`
- 冥想播放器的 `dayNumber` 传入 `camp.completed_days + 1`（用户看到的是"第几天的冥想"）
- "今日冥想 · Day X" 显示与冥想内容对应的天数

### 5. `src/components/wealth-camp/WealthTrilogyCard.tsx`
- StepStatusBadge 第 74 行：显示 `Day {progress.camp.currentDay}` → 确保 currentDay 现在是 `completed_days`

