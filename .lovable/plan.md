

## 修复：微信小程序中财富教练丢失测评数据

### 问题根因

在微信小程序中，语音走 WebSocket 中继模式（`miniprogram-voice-relay`），但中继服务器在第 117-141 行**重新创建了 OpenAI 会话**，使用的是通用的 `getSystemPrompt(mode)` 函数。

对于财富教练，`mode="general"`，所以 AI 收到的提示词是一个通用的"智能助手"人设，完全没有用户测评数据。

对比两条路径：

```text
Chrome (WebRTC)：
  用户点击 → wealth-assessment-realtime-token（构建个性化 prompt）
           → OpenAI 直连，使用个性化 prompt ✅

微信小程序 (WebSocket)：
  用户点击 → wealth-assessment-realtime-token（构建个性化 prompt）
           → miniprogram-voice-relay（丢弃 prompt，用通用 prompt 重建会话）❌
```

### 修复方案

**核心思路**：让 token 端点把个性化 prompt 编码到 token 响应中，relay 端解析并使用它，而非自己生成。

#### 文件 1：`supabase/functions/wealth-assessment-realtime-token/index.ts`

在返回的 JSON 中增加一个 `instructions` 字段，包含完整的个性化 prompt：

```text
返回值新增：
{
  ...data,
  instructions: instructions,   // <-- 新增
  realtime_url: ...,
  ...
}
```

#### 文件 2：`supabase/functions/miniprogram-voice-relay/index.ts`

1. 在 URL 参数中增加对 `instructions` 的支持（通过 URL 参数传递太长，改用另一种方式）

   更好的方案：让客户端在 WebSocket 连接建立后，先发一条 `session_config` 消息，携带 token 端点返回的 instructions。

2. 在 relay 的 `session.update` 构建中：
   - 如果收到客户端的 `session_config` 消息且包含 `instructions`，使用该 instructions
   - 否则 fallback 到 `getSystemPrompt(mode)`

#### 文件 3：`src/utils/MiniProgramAudio.ts`

1. 修改 `getEphemeralToken()` 方法，保存 token 端点返回的 `instructions` 字段
2. 在 WebSocket 连接建立后（`onopen`），立即发送一条 `session_config` 消息，将 instructions 传递给 relay

### 具体代码变更

| 文件 | 修改内容 |
|------|---------|
| `wealth-assessment-realtime-token/index.ts` | 返回值中增加 `instructions` 字段 |
| `miniprogram-voice-relay/index.ts` | 延迟 `session.update` 发送：先等客户端的 `session_config` 消息（带 500ms 超时），用其 instructions 替代默认 prompt |
| `src/utils/MiniProgramAudio.ts` | `connect()` 中保存 instructions，WebSocket 连接后发送 `session_config` 消息 |

### 流程变化

修复后的 WebSocket 路径：

```text
微信小程序 (WebSocket) 修复后：
  用户点击 → wealth-assessment-realtime-token（构建个性化 prompt，返回 instructions）
           → MiniProgramAudioClient 保存 instructions
           → 连接 miniprogram-voice-relay
           → 发送 session_config { instructions: "个性化prompt" }
           → relay 使用个性化 prompt 创建 OpenAI 会话 ✅
```

### 兼容性

- 情绪教练、生活教练等不传 instructions 的场景不受影响（relay fallback 到默认 prompt）
- Chrome WebRTC 路径不受影响
- 所有现有的 token 端点如需个性化 prompt，只需在返回值中添加 `instructions` 字段即可自动生效

