

# 确保合伙人手机号可匹配 — 多路径兼容方案

## 问题本质

绽放合伙人名单是以「姓名 + 手机号」导入的，自动匹配依赖 `profiles.phone` 字段。但用户有两条注册路径：

```text
路径 A：手机号注册 → profiles.phone 已填 → 可以匹配 (OK)
路径 B：微信登录注册 → profiles.phone 为空 → 无法匹配 (问题所在)
```

大部分绽放合伙人通过微信注册，所以手机号字段为空，自动匹配失效。

## 解决方案：三层保障

### 第一层：邀请链接直接携带邀请码（已有，优化体验）

当前邀请链接 `/invite/BLOOM-XXXX` 已经可以直接 claim。问题是用户微信登录后没有自动回到邀请页。

**优化**：在 `PartnerInvitePage` 跳转微信登录时，确保 `pending_partner_invite` 保存在 localStorage，并在微信回调（`WeChatOAuthCallback`）中自动执行 claim。这条路径**不依赖手机号**，直接用邀请码匹配。

**现状检查**：代码中 `WeChatOAuthCallback.tsx` 已有 `pending_partner_invite` 处理逻辑，但 `PartnerInvitePage` 跳转到 `/auth` 而非微信授权。需要修复跳转路径，确保微信环境下直接走微信 OAuth。

### 第二层：微信注册后强制补充手机号（新增）

对于没有通过邀请链接注册的微信用户，在首次登录后**引导补充手机号**：

- 在 `wechat-oauth-process` 注册新用户后，返回 `isNewUser: true`
- 前端已有逻辑：新用户跳转到 `/wechat-auth?mode=follow`
- 在关注页或 onboarding 流程中，增加一个「请输入手机号」步骤，提示文案：**「输入您购课时使用的手机号，系统将自动为您开通合伙人权益」**
- 手机号保存到 `profiles.phone` 后，立即触发 `auto-claim-bloom-invitation`

### 第三层：后端函数 — 手机号自动匹配（新增）

创建 `auto-claim-bloom-invitation` 边缘函数：

- 用户保存手机号时自动调用
- 也在每次登录时静默检查一次
- 用 `profiles.phone` 匹配 `partner_invitations.invitee_phone`
- 匹配成功 → 自动执行 claim 逻辑（复用现有权益发放代码）

## 具体实施步骤

### 步骤 1：创建 `auto-claim-bloom-invitation` 边缘函数

新建 `supabase/functions/auto-claim-bloom-invitation/index.ts`：

- 从 Authorization header 获取 user_id
- 查询 `profiles` 获取 phone
- 如果 phone 为空，直接返回 `{ matched: false }`
- 用手机号后 11 位匹配 `partner_invitations`（status='pending', partner_type='bloom'）
- 匹配成功 → 执行与 `claim-partner-invitation` 相同的权益发放逻辑
- 幂等：已是合伙人则返回 `{ already_partner: true }`

### 步骤 2：优化邀请页微信登录跳转

修改 `src/pages/PartnerInvitePage.tsx`：

- 检测微信环境（navigator.userAgent 包含 MicroMessenger）
- 微信环境下，点击「领取」按钮直接跳转微信 OAuth 授权，而非 `/auth` 页面
- 确保 `pending_partner_invite` 在 localStorage 中正确设置

### 步骤 3：手机号补充引导

修改 `src/components/profile/PhoneNumberManager.tsx` 或新建专门组件：

- 在保存手机号成功后，自动调用 `auto-claim-bloom-invitation`
- 如果自动领取成功，弹出 toast 提示「恭喜，已自动开通绽放合伙人权益！」

### 步骤 4：登录后静默检查

修改 `src/hooks/useAuth.tsx`：

- 在 `SIGNED_IN` 事件中，使用 sessionStorage 防重复，静默调用 `auto-claim-bloom-invitation`
- 无 UI 干扰，后台完成

## 涉及文件

| 文件 | 改动 |
|------|------|
| `supabase/functions/auto-claim-bloom-invitation/index.ts` | 新建：手机号自动匹配并发放权益 |
| `src/pages/PartnerInvitePage.tsx` | 修改：微信环境下正确跳转 OAuth |
| `src/components/profile/PhoneNumberManager.tsx` | 修改：保存手机号后触发自动匹配 |
| `src/hooks/useAuth.tsx` | 修改：登录后静默调用自动匹配 |

## 用户体验流程

```text
路径 A（最优）：收到邀请链接 → 点击 → 微信登录 → 自动 claim → 权益到账
路径 B（补救）：微信注册 → 补充手机号 → 自动匹配 → 权益到账
路径 C（兜底）：任何时候登录 → 后台静默检查 → 如有匹配 → 权益到账
```

三层保障确保无论用户通过哪条路径注册，只要手机号与导入名单匹配，都能自动获得绽放合伙人权益。

