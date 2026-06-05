## 问题定位

后端日志已经显示真实失败点：`miniprogram-voice-relay` 在初始化实时语音会话时发送了不被当前接口支持的字段：

```text
Unknown parameter: 'session.max_response_output_tokens'
```

这会触发后端把连接关闭为 `AI_CONFIG_ERROR`，前端收到 fatal error 后不再重连；用户再点“长按语音通话”时，WebSocket 通道已经不是 open 状态，所以出现“连接还没准备好”。

## 修复计划

1. 修复后端实时语音 session 配置
   - 删除 `supabase/functions/miniprogram-voice-relay/index.ts` 中的 `session.max_response_output_tokens`。
   - 保留当前 GA 版本所需的 `session.type`、`output_modalities`、`audio.input/output`、`turn_detection` 配置。
   - 同时确认错误分级不再把这个配置错误反复带入前端重连循环。

2. 优化前端失败后的重试状态
   - 在 `src/utils/MiniProgramAudio.ts` 的 `connect()` / `disconnect()` 路径中重置上一轮 `fatalError`、诊断状态和 WebSocket 状态，避免用户挂断后重新尝试仍继承旧 fatal 状态。
   - 让新一次点击可以真正创建新连接，而不是一直停留在“没准备好”。

3. 优化 PTT 首次按住体验
   - 在 `src/components/coach/CoachVoiceChat.tsx` 中，连接失败或致命错误后清空 `chatRef.current` 与初始化锁，保证重新点击能重新执行完整建连流程。
   - 对“连接中”与“连接失败”做更明确分支，避免还没建好通道时直接调用 `pttStart()` 触发误报 toast。

4. 验证
   - 部署/验证 `miniprogram-voice-relay` 后查看函数日志，确认不再出现 `Unknown parameter: session.max_response_output_tokens`。
   - 用函数日志和前端连接状态确认流程至少能到 `session.updated` / `ptt_config_applied`，再允许用户按住说话。