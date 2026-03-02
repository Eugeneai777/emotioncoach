

## Bug: 教练梳理完成后状态未显示已完成

### 问题分析

经过代码和数据库排查，发现了一个**状态竞态**问题：

1. 用户在"教练对话"标签完成教练梳理后，`handleCoachingComplete()` 在内存中将 `coachingCompleted` 设为 `true`
2. 同时，`handleCoachingComplete` 调用 `queryClient.invalidateQueries` 刷新日志数据
3. 刷新后的 `journalEntries` 触发 `useEffect`（第524行），该 effect 用 `!!todayEntry.behavior_block` **重新覆盖** `coachingCompleted` 的值
4. 如果此时 `generate-wealth-journal` 边缘函数尚未完成写入（异步调用），或写入失败，`behavior_block` 仍为 null，导致 `coachingCompleted` 被重置为 `false`

数据库验证：多条日志记录显示 `meditation_completed: true` 但 `behavior_block: null`，说明日志生成环节存在写入不完整或失败的情况。

### 解决方案

**双保险机制**：防止 useEffect 覆盖已确认的完成状态 + 增加回调重试

#### 修改 1：使用 ref 保护已确认的教练完成状态

在 `src/pages/WealthCampCheckIn.tsx` 中：

- 新增 `coachingCompletedRef` (类似已有的 `isRedoingMeditationRef` 模式)
- 在 `handleCoachingComplete` 中设置 `coachingCompletedRef.current = true`
- 在 `useEffect`（第524-552行）中检查：如果 `coachingCompletedRef` 为 true，则**不**用 DB 值覆盖 `coachingCompleted` 状态

```text
// 伪代码
const coachingJustCompletedRef = useRef(false);

handleCoachingComplete: 
  coachingJustCompletedRef.current = true
  setCoachingCompleted(true)
  ...

useEffect (journalEntries变化时):
  if (!coachingJustCompletedRef.current) {
    setCoachingCompleted(!!todayEntry.behavior_block)
  }
```

#### 修改 2：延迟重新验证

在 `handleCoachingComplete` 中，增加一个延迟查询（3秒后），等待边缘函数完成写入后再刷新数据：

```text
handleCoachingComplete:
  setCoachingCompleted(true)
  coachingJustCompletedRef.current = true
  // 立即刷新一次
  queryClient.invalidateQueries(...)
  // 3秒后再刷新一次（等待边缘函数完成）
  setTimeout(() => {
    queryClient.invalidateQueries(...)
    coachingJustCompletedRef.current = false  // 此时DB应已更新，允许同步
  }, 3000)
```

#### 修改 3：WealthCoachEmbedded 回调时机优化

在 `src/components/wealth-camp/WealthCoachEmbedded.tsx` 中，确保 `onCoachingComplete` 在 `generate-wealth-journal` 成功返回**之后**才调用（目前是在 briefing 数据生成后立即调用，可能先于日志写入完成）。

实际上回调链是：`useDynamicCoachChat` 中 tool call 处理 → 调用 `generate-wealth-journal` → 成功后调用 `onBriefingGenerated` → 调用 `onCoachingComplete`。这个顺序是正确的，问题在于 `queryClient.invalidateQueries` 触发的 refetch 可能比回调更快到达 useEffect。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/pages/WealthCampCheckIn.tsx` | 增加 `coachingJustCompletedRef` 防覆盖机制；`handleCoachingComplete` 增加延迟刷新 |

### 预期效果

- 用户完成教练梳理 → 立即显示已完成（绿色勾勾）
- 切换回"今日任务"tab → 仍然显示已完成
- 3秒后数据库同步完成，状态从 ref 保护切换为 DB 驱动，长期一致
