

## 优化微信小程序中的语音体验和界面

### 当前状况分析

经过代码审查，微信小程序语音已有基础架构（WebSocket 中继模式 + MiniProgramAudioClient），但存在以下可优化点：

### 优化项目

#### 1. 小程序环境下的 UI 适配
- **问题**：通话界面使用 `fixed inset-0`，在小程序 WebView 中可能被顶部胶囊按钮遮挡；底部安全区域未充分适配
- **方案**：为小程序环境增加顶部安全距离（约 88px），底部增加 `pb-safe` 适配

#### 2. 小程序权限引导优化
- **问题**：麦克风权限被拒后，仅弹 toast 提示，用户不知如何操作
- **方案**：在小程序环境中，权限被拒时显示引导弹窗，带"前往设置"按钮（调用 `wx.openSetting`）

#### 3. 音频播放增强
- **问题**：`MiniProgramAudioClient` 的 Web Audio 降级播放没有音量增益控制（主架构中 gain=4.0）
- **方案**：在 `playPCMWithWebAudio` 中加入 GainNode，音量放大到 4.0，与 WebRTC 模式一致

#### 4. 录音参数优化
- **问题**：Web Audio fallback 使用 `ScriptProcessorNode`（已废弃），且 bufferSize=16384 导致约 680ms 延迟
- **方案**：尝试使用 `AudioWorklet`（若可用），降级使用 `ScriptProcessorNode` 但 bufferSize 改为 4096（约 170ms 延迟）

#### 5. 小程序断线恢复优化
- **问题**：iOS 小程序后台切前台时，WebSocket 可能已断但 UI 未及时反馈
- **方案**：`visibilitychange` 时主动检测 WebSocket 状态，断开则立即显示"重新连接"按钮而非等待心跳超时

#### 6. 连接提示文案本地化
- **问题**：小程序模式下连接进度显示 "usingFallback" 等技术术语
- **方案**：在 `ConnectionProgress` 组件中，当 `usingFallback=true` 时显示"语音通道连接中"而非技术性描述

#### 7. 小程序静音开关兼容
- **问题**：iOS 静音开关会导致 Web Audio API 播放无声
- **方案**：在 `getPlaybackContext` 中创建 AudioContext 后，播放一个短暂的静音缓冲区来解锁音频

### 技术实现

**涉及文件**：
1. `src/utils/MiniProgramAudio.ts` — 音量增益、录音延迟优化、断线恢复、静音解锁
2. `src/components/coach/CoachVoiceChat.tsx` — 小程序 UI 安全区适配、权限引导弹窗
3. `src/components/coach/ConnectionProgress.tsx` — 小程序连接文案优化

**不涉及后端变更**，纯前端优化。

