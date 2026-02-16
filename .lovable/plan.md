

## 修复：session_config 消息被静默丢弃

### 问题根因

relay 的 `clientSocket.onmessage`（第 188 行）有一个前置守卫：

```
if (!isConnected || !openaiSocket) {
  console.warn('[Relay] Received message but not connected to OpenAI');
  return;  // <-- session_config 在这里被丢弃了
}
```

时序问题：
1. 客户端 WebSocket 连接成功 → 立即发送 `session_config`
2. 此时 relay 正在异步连接 OpenAI，`isConnected = false`
3. `session_config` 消息被守卫条件拦截并丢弃
4. OpenAI 连接成功后等待 500ms，但 instructions 早已丢失 → fallback 到默认 prompt

日志也印证了这一点：`[Relay] Using default prompt for mode: general`

### 修复方案

**文件：`supabase/functions/miniprogram-voice-relay/index.ts`**

将 `session_config` 的处理逻辑从受守卫保护的 `switch` 中提取出来，放到守卫之前。`session_config` 不需要转发给 OpenAI，只是用来设置变量，所以不需要 `isConnected` 条件。

修改 `clientSocket.onmessage` 处理器（约第 187-250 行）：

```
clientSocket.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);

    // session_config 必须在 OpenAI 连接前就能处理
    if (message.type === 'session_config' && message.instructions) {
      console.log('[Relay] Received client session_config with instructions');
      clientInstructions = message.instructions;
      if (instructionsResolve) {
        instructionsResolve(message.instructions);
        instructionsResolve = null;
      }
      return;
    }

    // 其他消息需要 OpenAI 连接就绪
    if (!isConnected || !openaiSocket) {
      console.warn('[Relay] Received message but not connected to OpenAI');
      return;
    }

    // ... 原有的 switch 逻辑（去掉 session_config case）
  }
}
```

同时更新 `ClientMessage` 接口（第 21-25 行）增加 `instructions` 字段：

```
interface ClientMessage {
  type: string;
  audio?: string;
  text?: string;
  instructions?: string;  // 新增
}
```

### 影响范围

| 文件 | 修改内容 |
|------|---------|
| `miniprogram-voice-relay/index.ts` | 将 `session_config` 处理提到守卫条件之前；`ClientMessage` 增加 `instructions` 字段 |

只修改一个文件，改动约 10 行。其他文件（token 端点、MiniProgramAudio.ts）无需改动，它们的逻辑是正确的。
