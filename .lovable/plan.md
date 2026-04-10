

# 修复小劲语音教练不扣点数问题

## 问题根因

`XiaojinVoice.tsx` 传了 `skipBilling={true}` 给 `CoachVoiceChat`，导致：
1. CoachVoiceChat 跳过了服务端扣费逻辑（`deduct-quota` edge function 从未被调用）
2. `billedMinutes` 始终为 0，UI 显示"0点"
3. 虽然 XiaojinVoice 自己用 localStorage 做了本地扣费，但这只是客户端模拟，不会真正从 `user_accounts` 扣款

## 修改方案

### 文件：`src/pages/xiaojin/XiaojinVoice.tsx`

**去掉 `skipBilling={true}`，去掉本地 localStorage 计费逻辑**，改为依赖 CoachVoiceChat 内置的服务端计费系统（8点/分钟）。

具体改动：
- 删除 `useXiaojinQuota` 引用和相关的本地计费 interval 逻辑
- 删除 `skipBilling={true}`
- 改为传 `userId`（从 useAuth 获取），让 CoachVoiceChat 走标准的服务端扣费流程
- 保留 `featureKey="realtime_voice_teen"` 不变

改动后页面逻辑与 `LifeCoachVoice.tsx` 对齐：检查登录 → 检查余额 → 每分钟服务端扣 8 点 → UI 实时显示已消耗点数。

### 不改的
- 不改 `CoachVoiceChat.tsx`
- 不改 `useXiaojinQuota.ts`（其他地方可能还在用）
- 不改数据库
- 不改 edge function

