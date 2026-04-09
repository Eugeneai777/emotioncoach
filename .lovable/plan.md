
问题判断

- 当前“今日打卡完成”和“日历 tab 完成状态”用的不是同一份数据。
- `CampCheckIn.tsx` 的任务完成依赖 `todayProgress`，所以两项任务完成后第一页能显示完成。
- 但 `CampProgressCalendar` 接收的是 `camp.check_in_dates`，而这份聚合字段在手动勾选或当次页面内切换时不会立即同步，所以日历格子仍显示未完成，右上角也还是 `0/1`。

修改方案

1. `src/pages/CampCheckIn.tsx`
- 新增“实际打卡日期”状态，直接从 `camp_daily_progress` 读取 `is_checked_in = true` 的 `progress_date`。
- `loadCampData()` 时一并加载这份日期列表。
- 日历 tab 和成长档案 tab 都改为传这份“实际打卡日期”给 `CampProgressCalendar`，不再依赖 `camp.check_in_dates`。
- 在 `handleToggleTask()` 中，当切换的是 `is_checked_in` 时：
  - 同步更新 `training_camps.completed_days / check_in_dates`
  - 并刷新“实际打卡日期”状态，保证勾选后切到日历立即看到已完成。

2. `src/components/camp/CampProgressCalendar.tsx`
- 右上角统计继续用传入的打卡日期数组，但来源改成真实进度数据。
- 顶部分母优先使用父级传入的 `currentDay`，避免组件自己再算一套导致显示不一致。
- 当今天已在真实打卡日期中时，当天格子显示“已打卡”，不再显示灰色未完成。

不改动

- 不改数据库结构
- 不改其它训练营业务规则
- 不动购买、补卡、分享等流程

技术说明

- 这次不是单纯“UI 没刷新”，根因是数据源分裂：
  - 任务区看 `todayProgress`
  - 日历区看 `training_camps.check_in_dates`
- 修复后，这个页面的日历会以 `camp_daily_progress` 作为真实来源；`training_camps` 继续做聚合同步，避免其它页面继续滞后。

验收标准

- 7天有劲训练营完成“冥想 + 情绪教练”后，不用重进页面，切到“日历”tab，当天立刻显示已完成。
- 右上角“已打卡 x/y 天”中的 `x` 与真实打卡天数一致。
- 手动勾选完成/取消完成后，日历状态同步变化，不再出现第一页已完成、日历页未完成的情况。
