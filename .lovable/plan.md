

## 修复 /human-coaches 已审核通过的真人教练不显示问题

### 根因

数据库 `human_coaches.status` 字段存在两套状态值并存：
- 管理后台审核通过 → 写入 `status = 'approved'`
- 前端 `useActiveHumanCoaches` 过滤条件 → `.eq("status", "active")`

导致 Lisa（已审核通过，status='approved'）在 `/human-coaches` 列表与 `CoachRecommendations` 推荐中均被过滤掉，只剩历史遗留的测试教练（status='active'）可见。

### 修复方案（两处统一改为兼容 approved + active）

**只改 1 文件**：`src/hooks/useHumanCoaches.ts`

将 `useActiveHumanCoaches` 的过滤条件由：
```ts
.eq("status", "active")
```
改为兼容两种"已上架"状态：
```ts
.in("status", ["approved", "active"])
```

同时把额外的"接单中"约束加上，避免显示已审核但暂停接单的教练：
```ts
.in("status", ["approved", "active"])
.eq("is_accepting_new", true)
```

> 选择前端兼容方案而非数据库迁移，原因：
> 1. `status='active'` 是历史遗留值（仅 1 条测试数据），不应破坏既有视图
> 2. 管理后台审核流程已稳定写入 `'approved'`，符合业界审核语义
> 3. 风险面最小，零 SQL 迁移、零 RLS 变更

### 同步检查 `CoachRecommendations`

`src/hooks/useCoachRecommendations.ts` 调用边缘函数 `recommend-coaches`，需要确认该函数内部是否也用 `status='active'` 过滤。如是，同步改为 `IN ('approved','active')`，否则推荐区仍漏显 Lisa。

### 验证标准

1. `/human-coaches` 列表页 → 显示 Lisa + 测试教练（共 2 位），列表上方"共 2 位教练可预约"
2. 智能推荐区 → Lisa 与测试教练均出现
3. 管理后台审核新教练通过后，前端 5 分钟缓存过期或刷新后即可见
4. 待审核（pending）/ 已拒绝（rejected）教练仍不显示

