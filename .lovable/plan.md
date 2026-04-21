

## 隐藏前端"测试教练"种子数据

### 根因

`human_coaches` 表中存在一条 2025-12-18 的种子测试数据：
- id: `00000000-0000-0000-0000-000000000001`
- name: `测试教练`，title: `心理咨询师`
- status: `active`（历史遗留状态）
- user_id: **NULL**（无真实用户绑定）

它出现在前端但管理后台看不到的原因：
1. 前端 `useActiveHumanCoaches` 已修复为 `IN ('approved','active')`，所以 `active` 测试数据也被拉出来
2. 管理后台「已通过(2)」列表按 user_id 关联 profiles 显示，user_id 为 NULL 的孤立记录被过滤掉了
3. 管理后台「总计 6」包含了这条数据，所以数字对不上（3 待审 + 2 已通过 + 0 拒绝 ≠ 6）

### 修复方案（数据库清理 · 单条 SQL 迁移）

直接物理删除这条种子数据及其关联子表（无 user_id 不影响任何真实用户）：

```sql
-- 1. 清理关联子表
DELETE FROM coach_certifications WHERE coach_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM coach_services       WHERE coach_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM coach_recommendations WHERE coach_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM coach_reviews        WHERE coach_id = '00000000-0000-0000-0000-000000000001';

-- 2. 删除主记录
DELETE FROM human_coaches WHERE id = '00000000-0000-0000-0000-000000000001';
```

> 不动前端 `IN ('approved','active')` 兼容逻辑，保留对未来可能出现的 `active` 状态的支持。本次仅清除孤立种子数据。

### 验证标准

1. 前端 `/human-coaches`：智能推荐区不再出现"测试教练"，列表"共 N 位教练可预约"中 N 减 1
2. 管理后台「真人教练管理」顶部统计：总计从 6 变为 5（= 3 待审 + 2 已通过 + 0 拒绝），数字自洽
3. 智能推荐区改为推荐 Lisa 或林蒿老师等真实已通过教练
4. 不影响任何真实用户的教练资料

