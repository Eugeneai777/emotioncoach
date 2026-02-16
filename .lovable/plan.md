

## 修复：Safari 浏览器无法接通财富教练语音

### 问题根因

Safari 对 WebRTC 和音频自动播放有比 Chrome 更严格的安全策略：

1. **用户手势要求**：Safari 要求 `navigator.mediaDevices.getUserMedia()` 必须在用户点击事件的**同步调用链**中触发。当前代码流程是：用户点击 → `handleClick` → `setShowVoiceChat(true)` → 组件渲染 → `useEffect` → `initVoiceChat()` → 深层异步调用 `getUserMedia`。这条调用链经过了 React 状态更新和 `useEffect`，Safari 认为已经脱离了用户手势上下文，因此拒绝麦克风访问。

2. **AudioContext 限制**：Safari 对 `AudioContext` 的创建和 `resume()` 同样要求用户手势上下文。

3. **WebRTC SDP 交换**：Safari 的 WebRTC 实现在某些情况下对 SDP 格式更严格。

Chrome 对这些限制相对宽松，所以同样的代码在 Chrome 中正常工作。

### 修复方案

**核心思路**：在用户点击按钮时（手势上下文中），**立即同步**请求麦克风权限，拿到 `MediaStream` 后再传递给后续的 WebRTC 连接流程。

#### 文件 1：`src/components/coach/CoachVoiceChat.tsx`

1. 在 `initVoiceChat()` 函数的**最开头**（在任何异步操作之前），立即调用 `getUserMedia` 获取麦克风流
2. 将获取到的 `MediaStream` 作为参数传递给 `RealtimeChat` 构造函数或 `init()` 方法
3. 同时在此处创建并 `resume()` 一个 `AudioContext`，确保 Safari 的音频系统被激活

具体修改位置：
- 在 `initVoiceChat` 函数开始处（约第 1100 行），在所有 `await` 之前，添加同步的麦克风请求
- 将 stream 传入后续的 `RealtimeChat` 和 `MiniProgramAudioClient`

#### 文件 2：`src/utils/RealtimeAudio.ts`

1. `RealtimeChat` 类增加一个可选参数 `preAcquiredStream?: MediaStream`
2. 在 `initConnection()` 中，如果传入了 `preAcquiredStream`，直接使用它，跳过内部的 `getUserMedia` 调用
3. 在 `unlockAudio()` 中增强 Safari 兼容性：使用 `webkitAudioContext` 兼容旧版 Safari

### 具体代码变更

| 文件 | 修改内容 |
|------|---------|
| `src/components/coach/CoachVoiceChat.tsx` | `initVoiceChat` 开头立即请求麦克风权限，将 stream 传递给 RealtimeChat |
| `src/utils/RealtimeAudio.ts` | RealtimeChat 支持接收预获取的 MediaStream，跳过内部 getUserMedia |

### 修复后效果

- Safari 用户点击"教练解说"按钮时，麦克风权限请求在用户手势上下文中立即触发
- 后续 WebRTC 连接直接复用已获取的音频流，不再二次请求
- Chrome 行为不受影响（向后兼容）
- 同时解决可能存在的 AudioContext 在 Safari 中无法自动 resume 的问题
