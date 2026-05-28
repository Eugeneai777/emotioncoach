## 根因定位

排查 `/become-coach?mode=proxy` 提交链路，发现 3 处问题，全部命中即提示"提交失败"。

### 问题 1（致命，所有 proxy 申请都会爆）— `coach_services` RLS 不允许 submitter 插入
当前策略：
```
教练可以管理自己的服务: human_coaches.user_id = auth.uid()
```
代申请时 `human_coaches.user_id = NULL`（待被代申请人后续认领），auth.uid() 是教练本人。INSERT 默认服务这一步必然违反 RLS → 抛错 → 顶层 catch 弹"提交失败"。
对比兄弟表 `coach_certifications` 已用 `user_id = auth.uid() OR submitted_by_user_id = auth.uid()`，本表漏了。

### 问题 2（self_initiated 专属）— 调用 `increment_coach_invitation_count(NULL)` 报错
`src/pages/BecomeCoach.tsx:472` 无条件调用：
```ts
await supabase.rpc('increment_coach_invitation_count', { p_invitation_id: invitationData.id });
```
教练自主代申请时 `invitationData = { source: 'coach_self_initiated' }`，`id` 为 undefined → PostgREST 拒绝（uuid 非法）→ 抛错 → "提交失败"。

### 问题 3（proxy 数据污染）— 默认服务名缺姓名
`src/pages/BecomeCoach.tsx:456`：
```ts
const serviceName = invitationData.default_service_name || `${basicInfo.displayName} 咨询`;
```
proxy 模式 `basicInfo.displayName` 为空，应改用 `effectiveName`（即 `proxyData.coachName`），否则产生" 咨询"这种孤儿服务名。

## 修复方案

### A. DB migration（新增 1 条 policy，不改表结构）
在 `coach_services` 上新增 INSERT/UPDATE/DELETE policy：
```sql
CREATE POLICY "Coach or submitter manages services"
ON public.coach_services
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.human_coaches hc
    WHERE hc.id = coach_services.coach_id
      AND (hc.user_id = auth.uid() OR hc.submitted_by_user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.human_coaches hc
    WHERE hc.id = coach_services.coach_id
      AND (hc.user_id = auth.uid() OR hc.submitted_by_user_id = auth.uid())
  )
);
```
保留原 "教练可以管理自己的服务" 策略不动（向后兼容已认领教练）。

### B. `src/pages/BecomeCoach.tsx`
1. L456：`serviceName` 改用 `effectiveName` 兜底：
   ```ts
   const serviceName = invitationData.default_service_name || `${effectiveName} 咨询`;
   ```
2. L472：跳过 self-initiated 的计数：
   ```ts
   if (invitationData.id && invitationData.source !== "coach_self_initiated") {
     await supabase.rpc('increment_coach_invitation_count', { p_invitation_id: invitationData.id });
   }
   ```
3. L399-400：删除已有 cert/service 那两条 `.delete().select("id")` 在 proxy 编辑模式同样需要 submitter 权限——A 的 policy 已覆盖 DELETE，无需额外改。

### C. 链路其它项核查（无需改）
- INSERT `human_coaches`：策略 `Submitter inserts coach application` 已允许 ✅
- INSERT `coach_certifications`：策略 `Coach or submitter manages certifications` 已允许 ✅
- 24h 节流 trigger：limit=5/24h、累计=10，正常使用不会触发 ✅
- 管理员后台 `HumanCoachesManagement` 按 `status='pending'` 拉单，自然包含 proxy 申请 ✅

## 验收
1. 已审核教练访问 `/human-coaches` → 点"代他人申请" → SMS 核验 → 填资料 → 提交 → 看到"申请提交成功"，跳转 success 页。
2. 后台 `/admin/human-coaches` 待审列表出现该条申请，可正常审批/拒绝。
3. 走 invite token 的代申请（旧链路）同样可提交（之前其实也被 coach_services RLS 卡住，此修一并解决）。
4. 自助申请（mode≠proxy）流程不受影响。

## 不在范围
- 不动 ProxyVerifyStep / SMS 核验逻辑
- 不动 approve_coach_application RPC、价格档位
- 不修改自助 `/coach-recruitment` 流程
