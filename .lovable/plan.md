

# 绽放合伙人付费页面 — 添加邀请码/兑换码入口

## 当前状况

- 53 条绽放合伙人邀请全部为 `pending`（无人成功领取）
- 三层自动匹配机制已部署（邀请链接 claim、手机号匹配、登录静默检查），但大部分用户通过微信注册，`profiles.phone` 为空，自动匹配无法触发
- 用户直接进入测评/训练营页面时，仍看到 ¥9.9 和 ¥299 的支付要求

## 解决方案

在 **AssessmentPayDialog**（¥9.9 测评支付弹窗）和 **WealthCampIntro**（¥299 训练营页面）中增加「我有邀请码」入口，让合伙人可以直接输入 `BLOOM-XXXX` 邀请码，跳过支付并自动开通权益。

同时修复 `auto-claim-bloom-invitation` 边缘函数中的 `getClaims` 调用（改用更可靠的 `getUser`），确保自动匹配在所有环境下稳定工作。

## 实现步骤

### 步骤 1：修复边缘函数认证方式

修改 `supabase/functions/auto-claim-bloom-invitation/index.ts`：

- 将 `userClient.auth.getClaims(token)` 替换为 `userClient.auth.getUser()`
- 用 `user.id` 获取 userId，与 `claim-partner-invitation` 和 `redeem-camp-activation-code` 保持一致
- 同步修复 `supabase/functions/claim-partner-invitation/index.ts` 中的相同问题

### 步骤 2：AssessmentPayDialog 添加邀请码入口

修改 `src/components/wealth-block/AssessmentPayDialog.tsx`：

- 在支付弹窗中增加「我有邀请码」按钮/链接
- 点击后展示输入框，用户输入邀请码后调用 `claim-partner-invitation` 函数
- 领取成功后自动关闭弹窗并触发 `onSuccess` 回调
- 仅在 `packageKey` 为 `wealth_block_assessment` 时显示此入口（避免在其他产品中出现）

### 步骤 3：WealthCampIntro 添加邀请码入口

修改 `src/pages/WealthCampIntro.tsx`：

- 在购买按钮旁边或下方添加「我有邀请码」入口
- 输入邀请码后调用 `claim-partner-invitation`
- 成功后刷新购买状态（`refetchPurchase`），页面自动切换为已购买状态

### 步骤 4：同步修复 claim-partner-invitation 认证

修改 `supabase/functions/claim-partner-invitation/index.ts`：

- 与步骤 1 相同，将 `getClaims` 替换为 `getUser`

## 涉及文件

| 文件 | 改动 |
|------|------|
| `supabase/functions/auto-claim-bloom-invitation/index.ts` | 修复：getClaims → getUser |
| `supabase/functions/claim-partner-invitation/index.ts` | 修复：getClaims → getUser |
| `src/components/wealth-block/AssessmentPayDialog.tsx` | 新增：邀请码输入入口 |
| `src/pages/WealthCampIntro.tsx` | 新增：邀请码输入入口 |

## 用户体验

合伙人进入测评或训练营页面 → 看到支付弹窗 → 点击「我有邀请码」→ 输入 BLOOM-XXXX → 系统自动开通合伙人身份 + 免费权益 → 继续使用

