

# 浮窗计时器：连接成功后才显示时间

## 问题
点击语音按钮后，`GlobalVoiceProvider` 立即设置 `startTime = Date.now()`，浮窗卡片马上开始显示通话时长。但此时连接尚未建立，误导用户以为已在通话中。

## 方案
在 `GlobalVoiceProvider` 中增加连接状态，浮窗卡片根据状态显示"连接中…"或通话时长。

### 改动

**`src/components/voice/GlobalVoiceProvider.tsx`**
- 新增 `isConnected` 状态，初始 `false`
- `startVoice` 时不设 `startTime`，设 `isConnected = false`
- 新增 `setVoiceConnected()` 方法，当连接成功时调用：设 `isConnected = true`、`startTime = Date.now()`
- `endVoice` 时重置 `isConnected = false`
- 通过 context 暴露 `setVoiceConnected`

**`src/components/coach/CoachVoiceChat.tsx`**
- 引入 `useGlobalVoice`
- 在 `updateConnectionPhase('connected')` 处调用 `setVoiceConnected()`

**`src/components/voice/FloatingVoiceCard.tsx`**
- 新增 `isConnected` prop
- 未连接时：绿色呼吸动画改为橙色/灰色，时间区域显示"连接中…"
- 已连接后：显示正常计时

### 不变项
- 拖动、挂断、恢复全屏等交互不变
- 连接流程本身不变

