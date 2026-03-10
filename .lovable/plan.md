

# 允许未登录用户使用婚姻语音教练

## 当前问题

`MarriageAITools.tsx` 第30行有登录检查，未登录用户点击语音教练会弹出"请先登录"提示，无法使用。

## 修改方案

### 文件：`src/pages/marriage/MarriageAITools.tsx`

1. **移除语音按钮的登录拦截**：删除 `handleVoiceClick` 中的 `if (!user)` 检查，直接 `setShowVoice(true)`
2. **日记保存保持登录检查**：`handleVoiceBriefingSaved` 中已有 `if (!user) return`，未登录时跳过日记保存即可
3. **传递 userId 兼容**：`CoachVoiceChat` 的 `userId` prop 已经是可选的（`userId?: string`），传 `undefined` 不会报错

改动非常小，只需去掉3行登录拦截代码。

