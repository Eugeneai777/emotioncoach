

# 修复"已坚持 0 天"问题

## 问题根因

数据库确认：`camp_daily_progress` 有 3 条打卡记录（4/7, 4/8, 4/9），但 `training_camps.completed_days = 0`，`check_in_dates = []`。

代码中 `handleToggleTask`（用户手动勾选任务时调用）只更新 `camp_daily_progress`，**从不更新** `training_camps` 的 `completed_days` 和 `check_in_dates`。而 UI 显示天数依赖的是 `training_camps` 的数据。

## 修改方案

### 1. 修复数据（SQL 迁移）

同步该用户（及所有类似情况用户）的 `training_camps` 数据：

```sql
UPDATE training_camps tc SET
  completed_days = sub.cnt,
  check_in_dates = sub.dates
FROM (
  SELECT camp_id, 
    COUNT(*) as cnt, 
    array_agg(progress_date::text ORDER BY progress_date) as dates
  FROM camp_daily_progress 
  WHERE is_checked_in = true
  GROUP BY camp_id
) sub
WHERE tc.id = sub.camp_id AND tc.completed_days < sub.cnt;
```

### 2. 修复代码（`src/pages/CampCheckIn.tsx`）

在 `handleToggleTask` 中，当 `field === 'is_checked_in' && checked === true` 时，增加对 `training_camps` 的同步更新（同 makeup 补卡逻辑）：

```typescript
if (field === 'is_checked_in' && checked) {
  const { data: campData } = await supabase
    .from("training_camps")
    .select("check_in_dates, completed_days")
    .eq("id", campId)
    .maybeSingle();
  
  const dates = Array.isArray(campData?.check_in_dates) ? campData.check_in_dates : [];
  if (!dates.includes(today)) {
    dates.push(today);
    await supabase
      .from("training_camps")
      .update({
        completed_days: (campData?.completed_days || 0) + 1,
        check_in_dates: dates,
      })
      .eq("id", campId);
  }
  await loadCampData();
}
```

### 3. 增强显示兜底（同文件 L626）

从 `camp_daily_progress` 查询实际打卡天数作为额外 fallback，确保即使 `training_camps` 数据不同步，UI 也能正确显示。

## 改动文件

- `src/pages/CampCheckIn.tsx` — handleToggleTask 增加同步逻辑 + 显示兜底
- SQL 迁移 — 修复存量数据

