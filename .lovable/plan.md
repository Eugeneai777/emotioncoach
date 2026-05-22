## 智能推荐：管理员暂停接单后，推荐位仍展示该教练

### 根因

`supabase/functions/recommend-coaches/index.ts` 第 46 行已经做了 `is_accepting_new = true` 过滤，**后端逻辑正确**。

问题出在前端缓存：

`src/hooks/useCoachRecommendations.ts`
```ts
staleTime: 10 * 60 * 1000  // 10 分钟
```

React Query 把推荐结果缓存 10 分钟，期间不会重新调用边缘函数。所以：
- 管理员在后台把某教练的「接单」开关关掉
- 普通用户的浏览器已经缓存了上一份推荐列表
- 用户在 10 分钟内刷新/重新进入 `/human-coaches`，仍看到该教练

下方「共 N 位教练可预约」的常规列表用的是 `useActiveHumanCoaches`（直接 SDK 查询 + RLS/视图过滤），它的 staleTime 短，所以那块没问题——也印证了截图里推荐位有"林蒿老师"、下方列表只有 Lisa。

### 方案

**仅前端一处改动**（不动数据库、不动边缘函数）：

`src/hooks/useCoachRecommendations.ts`：
- `staleTime: 30 * 1000`（30 秒，足够防抖且不再让暂停状态滞留 10 分钟）
- `refetchOnWindowFocus: true`（用户切回 Tab 自动拉新）
- `refetchOnMount: true`（重新进入页面强制刷新）

### 不做的事

- 不动后端过滤逻辑（已经正确）
- 不引入 realtime 订阅（成本与收益不匹配，30s staleTime 已足够）
- 不在管理员侧主动失效用户缓存（跨用户/跨设备，不可行）

### 验收

1. 管理员把"林蒿老师"接单开关关掉
2. 普通用户已停留在 `/human-coaches` 页面 → 切走再切回（或 30s 后刷新） → 智能推荐位不再显示该教练
3. 重新打开该开关 → 同样在 30s 内自动恢复

### 改动文件

- 编辑 `src/hooks/useCoachRecommendations.ts`
