## 目标
让已通过审核的真人教练，从 `/human-coaches` 的"代他人申请"按钮进入 `/become-coach?mode=proxy` 时，**无需邀请令牌**即可发起代申请；被代申请人的资料仍进入管理员后台审核队列（与现有 invite 流程一致）。

## 修改点（仅前端 + 校验逻辑）

### 1. `src/pages/BecomeCoach.tsx` — 放宽代申请闸门
- 引入 `useCoachProfile()`，得到 `coachProfile`、`isCoachLoading`。
- 新增派生变量 `isApprovedCoach = coachProfile?.status === "approved"`。
- 改写 invite 校验流程：
  - 当 `mode === "proxy"` **且** `isApprovedCoach` **且** 无 `inviteToken` 时，将 `inviteStatus` 视为 `"valid"`，并构造一个轻量 `invitationData = { source: "coach_self_initiated", invitee_name: null, default_certifications: [] }`，跳过 `lookup_coach_invitation` 调用。
  - 其它三种情况（无 token + 非教练 / 无 token + self 模式 / 有 token）保持原逻辑。
- 提交校验 L282：将条件改为 `inviteStatus !== "valid"` 即可放行（已涵盖上面注入的 "valid"）。
- L514 `currentUrl` 在无 invite 时回退为 `/become-coach?mode=proxy`，避免登录重定向丢失 mode。
- 顶部"非邀请代申请"小提示条：显示「您正以教练 {coachProfile.name} 的身份代他人申请，提交后将进入审核」。

### 2. `src/pages/HumanCoaches.tsx` — 入口收口
- "代他人申请"按钮只在 `coachProfile?.status === "approved"` 时显示（避免 pending/rejected 教练点了再被闸门挡）。
- 鼠标悬停 tooltip："为他人代填申请，提交后由管理员审核"。

### 3. `src/components/coach-application/MyApplicationsCard.tsx` — 列表查询
- 当前仅按 `inviteToken` 过滤"我代申请过的记录"。需追加：当无 token 时按 `submitted_by_user_id = user.id AND user_id IS NULL` 查询当前教练所有自主发起的代申请记录，便于复看/编辑。
- 编辑入口跳转保持 `/become-coach?edit=<id>&mode=proxy`（不再强行附带 invite）。

### 4. 数据库 / RLS 检查（只读核实，**不改 schema**）
确认以下 RLS 已允许 approved 教练自主插入 `human_coaches` 行（`user_id=null` + `submitted_by_user_id=auth.uid()`）：
- INSERT policy：现有策略若只允许 invited 用户插入，需要追加"approved coach 可代为插入"的策略。
- SELECT policy：教练本人能 SELECT 自己 `submitted_by_user_id` 的代申请行。

如发现 RLS 不允许，则需要一次 migration（仅追加 policy，不动表结构）。**这一步在实施开始时先 read_query 核实，再决定是否需要 migration**。

### 5. 审核侧
- 后台 `CoachApplicationDetail` / `HumanCoachesManagement` 已按 `status='pending'` 列出所有待审，不区分 invite 来源，**无需改动**。
- 可选：在管理员申请详情上显示一个 "申请来源" 字段（invite token / coach_self_initiated / admin）方便审计 —— 本轮不做，留待后续。

## 不在本次范围
- 不修改 `ProxyVerifyStep` 的 SMS 核验逻辑（教练本人手机收码仍是必经步骤，作为代申请的反滥用闸门）。
- 不修改 `approve_coach_application` RPC、节流 trigger、价格档位逻辑。
- 不动 `/coach-recruitment` 招募页（自助申请仍需走原 invite 流程，本轮不放宽）。
- 不做 "Bloom 合伙人/金牌教练" 等更细粒度的权限限制 —— 当前规则：**任何 approved 教练**都可代申请，由 24h/累计节流 trigger 兜底防滥用。

## 验收
1. 已通过审核的教练访问 `/human-coaches` → 看到 "代他人申请" 按钮 → 点击进入 `/become-coach?mode=proxy`（无 invite）→ 直接看到 ProxyVerifyStep，**不再撞 "需要邀请链接"** 页。
2. 未登录用户 / 未审核教练访问 `/human-coaches` → 看不到 "代他人申请" 按钮。
3. 教练完成 SMS 核验 → 填写资料 → 提交成功 → 后台管理员在 `/admin/human-coaches` 待审列表看到新申请，可正常审批 / 拒绝。
4. 教练在 `BecomeCoach` 顶部 MyApplicationsCard 能看到自己历史代申请，可编辑 pending 状态的记录。
