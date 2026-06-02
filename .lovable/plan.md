# 修复真人教练详情页"教练不存在"

## 问题
- `human_coaches` 表 RLS 只允许教练本人 / 提交人 / 管理员读
- 列表上的卡片由 `recommend-coaches` Edge Function（service role）返回，能看到
- 详情页 `useHumanCoach` 用前端 SDK 查 `human_coaches_public` 视图（`security_invoker=on`，继承基表 RLS）→ 被过滤为空 → 显示"教练不存在"
- 同一根因还会让 `useActiveHumanCoaches` 列表查询、按 specialty 筛选、搜索等对普通用户全部返回空

## 修复方案

### 1. 数据库迁移
- 在 `human_coaches` 上新增 SELECT 策略：允许任意角色（anon + authenticated）读取 `status IN ('approved','active') AND is_accepting_new = true` 的行
  - 该策略只对基表生效；通过 `human_coaches_public` 视图查询时，因 `security_invoker=on`，仍会走这条策略，安全字段（phone、wechat_id、submitted_by_user_id 等）依然只能由教练本人 / 管理员通过基表读取
- 给 `human_coaches_public` 视图补齐 `GRANT SELECT TO anon, authenticated`（视图本身缺 grants）
- 保持现有"教练本人/管理员看完整资料"的策略不变

### 2. 前端兜底（防御性）
- `useHumanCoach`：当 `error.code === 'PGRST116'`（single 找不到）时返回 `null` 而不是 throw，避免一次性把整页打挂
- `HumanCoachDetail` 在 `!coach` 分支里，文案保留"教练不存在"，但增加一段提示行（如"可能已下线或不公开"），便于日后排查

### 3. 防止类似回归
- 在 `mem://technical/security/rls-systemic-hardening-and-view-isolation` 追加规则：**所有面向用户列表/详情的"安全视图"都必须确保基表对目标受众有匹配的 SELECT 策略**，否则视图查询会静默返回空。给本次新增策略写测试性 SELECT 验证（通过 `set role authenticated` + `set request.jwt.claims` 模拟普通用户读取）

## 技术细节

涉及文件：
- `supabase/migrations/<new>.sql`：新增策略 + 视图 grants
- `src/hooks/useHumanCoaches.ts`：`useHumanCoach` 错误兜底
- `src/pages/HumanCoachDetail.tsx`：空态文案微调（可选）
- `mem://technical/security/rls-systemic-hardening-and-view-isolation`：更新规则

SQL 草案：
```sql
CREATE POLICY "Anyone can view active approved coaches"
ON public.human_coaches FOR SELECT
USING (status IN ('approved','active') AND is_accepting_new = true);

GRANT SELECT ON public.human_coaches_public TO anon, authenticated;
```

不影响：
- 现有"教练本人/提交人/管理员看完整资料"的策略
- 推荐列表 Edge Function 行为
- 写入策略
