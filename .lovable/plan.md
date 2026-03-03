

## 修复：完成打卡后右上角完成天数自动更新

### 问题原因

当教练梳理完成后，`useDynamicCoachChat` 会更新数据库中的 `training_camps.completed_days`（+1），但 `handleCoachingComplete` 只刷新了 `wealth-journal-entries` 查询，没有刷新 `wealth-camp` 查询。因此右上角 header 显示的 `camp.completed_days` 仍然是旧值，直到用户手动刷新页面。

### 解决方案

在 `handleCoachingComplete` 中增加对 `wealth-camp` 查询的 invalidate，使 camp 数据自动重新获取。

### 修改文件

**`src/pages/WealthCampCheckIn.tsx`**

在 `handleCoachingComplete` 函数中：

1. 立即刷新时，增加 `queryClient.invalidateQueries({ queryKey: ['wealth-camp'] })`
2. 3 秒延迟刷新时，同样增加对 `wealth-camp` 的刷新
3. 同时也刷新 `user-camp-mode` 查询（确保模式状态同步）

```text
handleCoachingComplete:
  ...
  queryClient.invalidateQueries({ queryKey: ['wealth-journal-entries', campId] });
  queryClient.invalidateQueries({ queryKey: ['wealth-camp'] });        // 新增
  queryClient.invalidateQueries({ queryKey: ['user-camp-mode'] });     // 新增
  ...
  setTimeout(() => {
    queryClient.invalidateQueries({ queryKey: ['wealth-journal-entries', campId] });
    queryClient.invalidateQueries({ queryKey: ['wealth-camp'] });      // 新增
    queryClient.invalidateQueries({ queryKey: ['user-camp-mode'] });   // 新增
    coachingJustCompletedRef.current = false;
  }, 3000);
```

改动极小，仅增加 4 行 invalidate 调用。
