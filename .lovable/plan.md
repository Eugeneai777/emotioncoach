

# 点击语音按钮直接显示最小化浮窗

## 改动

### `src/components/voice/GlobalVoiceProvider.tsx`
- `startVoice` 方法改为启动时直接设置 `isMinimized = true`（第 40 行 `setIsMinimized(false)` 改为 `setIsMinimized(true)`）

这样点击语音按钮后，`CoachVoiceChat` 仍在后台渲染并建立连接，但用户看到的是可拖动的浮动小卡片，不会被全屏遮挡。用户点击小卡片可随时展开全屏。

### 不变项
- 浮窗拖动、恢复全屏、挂断等交互不变
- 连接流程不变（CoachVoiceChat 仍正常初始化）

