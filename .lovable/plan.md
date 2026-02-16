

## 修复：微信小程序中无法打断对方说话

### 问题根因

在 WebRTC 模式（Chrome）下，OpenAI Realtime API 自动处理打断：当 VAD 检测到用户说话时，OpenAI 会立即停止音频输出，客户端的 WebRTC 连接也会自动切换。

但在 WebSocket 中继模式（微信小程序）下，打断需要**手动实现**，因为音频播放是客户端自己管理的（队列 + 逐段播放）。目前有两个关键缺失：

1. **客户端收到 `speech_started` 后没有停止播放**：relay 已经转发了 `speech_started` 事件，但客户端的 `handleServerMessage` 将其归入 `default` 分支，仅传递给回调，没有清空音频队列或停止当前播放。

2. **relay 没有转发 `response.audio.interrupted` 事件**：当用户打断 AI 说话时，OpenAI 发送此事件通知客户端停止播放剩余音频。relay 的 `handleOpenAIMessage` 没有处理此事件（被默认忽略）。

### 修复方案

#### 文件 1：`src/utils/MiniProgramAudio.ts`

在 `handleServerMessage` 的 `switch` 中增加对 `speech_started` 的处理：

- 收到 `speech_started` 时，立即调用 `stopAudioPlayback()`（清空队列 + 停止当前播放）
- 同样处理 `response_interrupted` 事件

```text
case 'speech_started':
  // 用户开始说话 → 立即停止 AI 音频播放（实现打断）
  this.stopAudioPlayback();
  this.config.onMessage(message);
  break;

case 'response_interrupted':
  // AI 响应被打断 → 清空剩余音频
  this.stopAudioPlayback();
  this.config.onMessage(message);
  break;
```

#### 文件 2：`supabase/functions/miniprogram-voice-relay/index.ts`

在 `handleOpenAIMessage` 中增加对以下 OpenAI 事件的转发：

- `response.audio.interrupted`：通知客户端 AI 的音频输出已被打断
- `input_audio_buffer.committed`：确认音频缓冲区已提交（可选）

```text
case 'response.audio.interrupted':
  // AI 音频被用户打断
  clientSocket.send(JSON.stringify({
    type: 'response_interrupted',
  }));
  break;
```

### 修复后的打断流程

```text
用户说话（AI正在播放音频）
  → 麦克风持续发送 audio_input 到 relay
  → relay 转发到 OpenAI
  → OpenAI VAD 检测到用户语音
  → OpenAI 发送 input_audio_buffer.speech_started
  → relay 转发 speech_started 给客户端
  → 客户端收到 → stopAudioPlayback()（清空队列+停止播放） ✅
  → OpenAI 发送 response.audio.interrupted
  → relay 转发 response_interrupted 给客户端
  → 客户端再次确认清空 ✅
  → OpenAI 处理用户新的语音输入并生成新回复
```

### 具体代码变更

| 文件 | 修改内容 |
|------|---------|
| `src/utils/MiniProgramAudio.ts` | `handleServerMessage` 增加 `speech_started` 和 `response_interrupted` 的处理，调用 `stopAudioPlayback()` |
| `miniprogram-voice-relay/index.ts` | `handleOpenAIMessage` 增加 `response.audio.interrupted` 事件的转发 |

改动量很小，每个文件约增加 5-10 行。

