## 问题根因

- `/coach-recruitment` 页「立即申请入驻」按钮跳到 `/become-coach`（不带 `?invite=...`）。
- `src/pages/BecomeCoach.tsx` 第 91–110 行的逻辑：没有 `inviteToken` 且不是「已审核教练 + proxy 模式」时，`inviteStatus` 被设为 `"none"`，渲染第 534–547 行的「需要邀请链接」拦截页。
- 这导致普通用户无法自助申请——与招募页 CTA 文案矛盾。

## 目标（按你的选择：混合模式）

- **默认自助**：任何已登录用户访问 `/become-coach` 都能填表提交，进入待审核。
- **保留邀请特权**：带 `?invite=token` 时，照旧从邀请记录预填资质（`default_certifications`）、默认服务名（`default_service_name`），并在提交后对邀请计数 +1。
- **保留 proxy 代申请**：已通过审核的教练继续可走 `mode=proxy` 不带 invite 的代申请路径（已实现，不动）。
- **失效邀请仍拦截**：`?invite=xxx` 但 token 过期/无效时，仍显示「邀请链接已失效」页，不静默降级为自助（避免用户误以为邀请有效）。

## 变更点

### 1. `src/pages/BecomeCoach.tsx`

- **第 91–110 行**：当 `!inviteToken && !coachBypass` 时，不再设置 `"none"`，而是设置：
  ```ts
  setInvitationData({
    source: "self_initiated",
    invitee_name: null,
    default_certifications: [],
    // id 故意留空 → 提交时跳过 increment（已有逻辑兼容）
  });
  setInviteStatus("valid");
  ```
- **第 489–492 行**：把 `invitationData.source !== "coach_self_initiated"` 改为同时排除 `"self_initiated"`，确保无邀请的自助申请不会去 `increment_coach_invitation_count`。
- **第 534–562 行**：保留「邀请链接已失效」分支（`inviteStatus === "invalid"`），删除/不再触发 `"none"` 拦截渲染（实际上 `"none"` 不会再被设置，可以保留分支作为兜底但不可达）。
- 第 619 行的「您已收到教练入驻邀请」提示已经判断了 `invitationData.source !== "coach_self_initiated"`，需要同步加上 `!== "self_initiated"`，让自助申请不显示这条横幅。
- 第 463 行默认服务名 `invitationData.default_service_name || \`${effectiveName} 咨询\`` 已经有 fallback，无需改动。

### 2. `src/pages/CoachRecruitment.tsx`

无需改动——按钮已经跳 `/become-coach`，配合上面改造后会正常进入填表流程。

## 不影响的部分

- 邀请链接的所有现有能力（预填资质、计数、过期校验）。
- proxy 代申请路径（`coachBypass` 分支保持原样）。
- 后端 RLS / `human_coaches` 插入策略（proxy 路径已证明无 invite 也能插入，无需迁移）。
- 防刷限制（`coach_application_throttle_24h` 等错误处理已存在）。

## 验收

1. 未登录访问 `/become-coach` → 跳登录后回到表单（已有逻辑）。
2. 已登录无邀请访问 `/become-coach` → 直接看到填表页，提交后进入待审核，**不再**显示「需要邀请链接」。
3. 带有效 `?invite=xxx` 访问 → 看到「您已收到邀请」横幅，资质字段预填，提交后邀请计数 +1。
4. 带过期 `?invite=xxx` 访问 → 仍显示「邀请链接已失效」页。
5. 已审核教练 `?mode=proxy` → 代申请路径不变。
