
# 情绪教练语音通话"听我说话"卡住问题修复

## 问题诊断

### 症状
用户在移动端微信中使用情绪教练语音通话，接通后一直显示"听我说话"状态，没有任何 AI 回复。

### 后端日志分析
后端 `doubao-realtime-relay` 日志显示：
- ASR 正常识别用户语音（"你好" endpoint=true）
- TTS 正常生成 AI 回复（event=550: "好有呀，你想什么跟..."）
- 音频包正常转发（event=352: TTS 音频数据）
- 会话完整运行直到用户主动关闭

**结论**：后端完全正常工作。

### 根本原因
在 `DoubaoRealtimeAudio.ts` 的 `handleMessage` 方法中，存在 **switch-case 穿透（fall-through）** 逻辑错误：

```typescript
// 第 638-678 行的问题代码
case 'heartbeat':
case 'pong':
case 'response.audio.delta':      // ← 问题起点
case 'response.audio.done':
case 'response.done':
case 'response.audio_transcript.delta':
case 'conversation.item.input_audio_transcription.completed':
case 'input_audio_buffer.speech_started':
case 'input_audio_buffer.speech_stopped':
  // 重置心跳时间
  this.lastHeartbeatResponse = Date.now();
  this.missedHeartbeats = 0;
  // 只有 heartbeat/pong 会 break
  if (message.type === 'heartbeat' || message.type === 'pong') {
    break;
  }
  // ⚠️ 关键问题：其他消息类型没有 break，会穿透到下一个 case！

case 'input_audio_buffer.speech_started':  // ← 被穿透到这里
  this.onSpeakingChange('user-speaking');  // ← 覆盖了 assistant-speaking！
  break;
```

当收到 `response.audio.delta` 时：
1. 进入第一组 case，重置心跳时间 ✓
2. 没有 `break`，穿透到 `input_audio_buffer.speech_started` 
3. 调用 `onSpeakingChange('user-speaking')` ✗（错误！应该是 `assistant-speaking`）
4. 从来没有执行到第 665-669 行真正处理音频的代码

这导致：
- UI 状态被错误地设为 "user-speaking"（听我说话）而非 "assistant-speaking"
- `handleAudioDelta` 可能没有被正确调用，音频没有播放

---

## 修复方案

### 核心修复
重构 `handleMessage` 中的 switch-case 逻辑，确保：
1. 心跳重置逻辑与业务处理逻辑分离
2. 每个消息类型有独立的处理分支
3. 不存在意外的 case 穿透

### 代码修改

将第 638-680 行的问题代码改为：

```typescript
// 🔧 修复：心跳重置逻辑集中处理，不使用 case 穿透
// 收到任何有效消息都说明连接活跃，重置心跳超时
const validActivityTypes = [
  'heartbeat', 'pong',
  'response.audio.delta', 'response.audio.done', 'response.done',
  'response.audio_transcript.delta',
  'conversation.item.input_audio_transcription.completed',
  'input_audio_buffer.speech_started', 'input_audio_buffer.speech_stopped'
];
if (validActivityTypes.includes(message.type)) {
  this.lastHeartbeatResponse = Date.now();
  this.missedHeartbeats = 0;
}

switch (message.type) {
  case 'session.connected':
    // ... 现有逻辑不变
    break;

  case 'session.closed':
    // ... 现有逻辑不变
    break;

  case 'heartbeat':
  case 'pong':
    // 已在上面处理心跳重置，这里直接 break
    break;

  case 'input_audio_buffer.speech_started':
    this.onSpeakingChange('user-speaking');
    break;

  case 'input_audio_buffer.speech_stopped':
    this.onSpeakingChange('idle');
    break;

  case 'response.audio.delta':
    if (message.delta) {
      this.handleAudioDelta(message.delta);
      this.onSpeakingChange('assistant-speaking');
    }
    break;

  case 'response.audio.done':
    setTimeout(() => {
      this.onSpeakingChange('idle');
    }, 500);
    break;

  case 'response.done':
    this.awaitingResponse = false;
    break;

  // ... 其他 case 保持不变
}
```

---

## 技术细节

### 修改文件
| 文件 | 修改内容 |
|-----|---------|
| `src/utils/DoubaoRealtimeAudio.ts` | 重构 handleMessage switch-case 逻辑，消除穿透问题 |

### 验证要点
1. 接通后 AI 主动问好（"你好呀，我是劲老师..."）
2. UI 状态正确切换：
   - 用户说话时显示"用户说话中"
   - AI 回复时显示"AI 回复中"  
   - 空闲时显示正常状态
3. 能听到 AI 的语音回复
4. 不会出现"一直显示听我说话"的卡死状态

---

## 实施优先级
**P0 - 阻塞性 Bug**：当前情绪教练语音通话在微信中完全无法使用，必须立即修复。
