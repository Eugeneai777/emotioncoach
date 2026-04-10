

# 修复训练营用户余额不足时的处理逻辑

## 问题

上次修复中，为训练营用户添加了 `hasActiveCampRef` 标记，**完全跳过了扣费逻辑**（`deductQuota` 直接 `return true`）。这不符合业务需求。

正确行为应该是：训练营用户照常扣费，余额不足时弹出 `UnifiedPayDialog`（365会员续费弹窗），而不是直接跳过。

## 修改方案

### 文件：`src/components/coach/CoachVoiceChat.tsx`

移除所有 `hasActiveCampRef` 相关逻辑，恢复训练营用户的正常扣费流程：

1. **删除** `hasActiveCampRef` 声明（约第132行）
2. **删除** `checkQuota` 中训练营检查及 `hasActiveCampRef.current = true`（约第414-426行），让训练营用户走正常的余额检查，余额不足时返回 `'show_pay'` 弹出支付弹窗
3. **删除** `deductQuota` 中 `hasActiveCampRef.current` 条件（约第547行），恢复为仅检查 `skipBilling`
4. **删除** 每分钟扣费 `useEffect` 中 `hasActiveCampRef.current` 条件（约第1708行）
5. **删除** 低余额警告 `useEffect` 中 `hasActiveCampRef.current` 条件（约第1805行）

### 不改的
- 不改 `UnifiedPayDialog`、edge function、数据库
- 不改 `insufficientDuringCall` 续费流程（已有正确的365会员弹窗逻辑）
- 不改 `skipBilling` 逻辑（财富教练等仍需要）
- 不改其他页面

### 效果
训练营用户与普通用户一样：正常扣费 → 余额不足时弹出365会员支付弹窗 → 充值后继续通话。

