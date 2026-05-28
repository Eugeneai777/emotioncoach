## 目标
在管理后台「真人教练管理 → 已通过」列表的每条教练卡上增加「删除」按钮，便于清理测试数据。

## 实现要点

### 1. UI 改动：`ApprovedCoachesList.tsx`
- 在卡片右下角操作区（眼睛、编辑按钮旁）新增一个红色 `Trash2` 图标按钮。
- 点击后弹出 `AlertDialog` 二次确认：「确定删除教练 {name}？此操作不可恢复，且会同时移除其资质、服务等关联数据。」
- 确认后执行删除 mutation，成功后 toast 提示并刷新 `human-coaches` / `human-coaches-stats` 查询。

### 2. 删除 mutation（前端 SDK 调用，依赖管理员 RLS）
按以下顺序删除，避免外键阻塞：
1. `coach_certifications` where `coach_id = X`
2. `coach_services` where `coach_id = X`
3. `coach_price_tiers`（如存在）where `coach_id = X`
4. `human_coaches` where `id = X`

每个 delete 都附 `.select()` 并检查返回长度，遵循"SDK CRUD Hardening"规范，防止 RLS 静默失败。任一步失败立即 toast 报错并中止。

### 3. 不改动范围
- 不动 `coach_appointments` / `appointment_reviews`（若该教练有真实订单或评价应禁止删除——但本场景为测试号无订单，依靠数据库外键报错即可暴露）。如外键报错，提示用户「该教练存在历史订单/评价，无法删除，请改为停用」。
- 不动 RLS / 数据库结构（管理员已有 human_coaches 全权限）。
- 待审核 / 已拒绝列表本次不加（用户只要求已通过那条）。

## 验收
- 「已通过」列表每张卡右下角出现红色删除图标。
- 点击 → 确认 → 教练消失，统计数字 -1。
- 删除测试号「李先生」可成功。
