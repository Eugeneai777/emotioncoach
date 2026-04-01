
结论

- 从日志看，不是“模型没有回复”，而是“回复已经出来了，但前端播放失败了”。
- 直接证据：
  - 客户端日志里先后出现了 `response.audio.started`、`response.audio.done`，说明后端已经返回了回复音频。
  - 同时客户端在 `src/utils/DoubaoRealtimeAudio.ts` 的 `processPlayQueue()` 报错：`RangeError: byte length of Int16Array should be a multiple of 2`。
  - 后端中继日志显示会话建立、开场白发送、usage 事件都有，且没有上游报错，说明语音服务本身是有产出的。

我会按下面方案修：

1. 修复前端 PCM 播放容错
- 修改 `src/utils/DoubaoRealtimeAudio.ts`
- 给播放器增加“残留半个采样字节”缓存。
- 如果收到的 PCM 长度是奇数，不直接 `new Int16Array(...)`，而是把最后 1 byte 暂存，等下一块拼上再解码。
- 在 `clearAllAudio()` 和 `disconnect()` 时同步清空这个残留缓存，避免串音或脏数据。

2. 加固中继的音频帧解析
- 检查 `supabase/functions/doubao-realtime-relay/index.ts` 里 `parseServerFrame()` 对 `EVENT_TTS_RESPONSE` 的偏移解析。
- 为音频帧补边界校验：
  - `payloadSize`
  - `audioSize`
  - 实际剩余字节数
- 只把真正的 PCM 数据转发给前端；如果上游帧末尾有多余字节或长度异常，要在中继层先规整掉，而不是把脏数据送到播放器。

3. 统一豆包通道的“AI正在回复”事件
- 当前 `CoachVoiceChat` 更偏向监听 `response.audio.delta` / `response.done`。
- 但豆包这条链路发的是 `response.audio.started` / `response.audio.done`。
- 我会把这两套事件统一映射，避免出现“其实有回复，但 UI 像没回复”的错觉。

4. 保留现有打断能力
- 不回退你前面已经修好的心跳和打断逻辑。
- 修复后继续保证：
  - AI 开口时能正常播出
  - 用户插话时能立刻停掉旧音频
  - 不再出现双重回复叠加

验证标准

- 再进一次 `/emotion-coach` 通话：
  - 控制台不再出现 `byte length of Int16Array should be a multiple of 2`
  - 开场白能正常听到
  - 你说一句后，AI 能继续语音回复
  - 主动打断时，只保留最新一轮回复，不重叠播放

技术说明

- 重点文件：
  - `src/utils/DoubaoRealtimeAudio.ts`
  - `supabase/functions/doubao-realtime-relay/index.ts`
  - `src/components/coach/CoachVoiceChat.tsx`
- 这次问题不涉及数据库、权限或登录流程。
- `useVoiceSessionLock` 那条“尝试释放非当前会话的锁”警告我也看到了，但它发生在挂断收尾阶段，不是这次“没有回复”的主因，可以后续单独清理。
