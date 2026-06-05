## 诊断结论

手机端失败不是用户网络问题，而是小程序 WebSocket 语音中继仍在使用已废弃的 OpenAI Realtime Beta WebSocket 形态。

后台日志连续出现：

```text
OpenAI disconnected: 4000 invalid_request_error.beta_api_shape_disabled
```

这会导致流程变成：

```text
按住语音 → 前端显示 connecting → 中继连 OpenAI 被拒 → WebSocket 关闭 → 前端自动重连 → 再次被拒 → 一直显示“网络波动 / 正在接通”
```

所以 WiFi 和手机网络都会一样失败。

## 修复计划

1. 修复 `supabase/functions/miniprogram-voice-relay/index.ts`
   - 移除旧的 Realtime Beta WebSocket 连接方式：
     - `wss://api.openai.com/v1/realtime?model=...`
     - `openai-beta.realtime-v1`
   - 改为当前可用的 Realtime GA 事件格式。
   - 给 `session.update` 增加必需的 `session.type = "realtime"`。
   - 把旧字段迁移为 GA 音频字段结构：
     - 输入音频格式
     - 输出音频格式
     - 语音 voice
     - 转写配置
     - PTT 的 `turn_detection: null`

2. 修复小程序端前端状态循环
   - `MiniProgramAudio.ts` 中连接失败/重连失败时，避免无限显示“网络波动”。
   - 当中继返回明确不可恢复错误时，切到 `error/disconnected`，让用户看到真实失败状态，而不是一直自动恢复。
   - 清理重连时旧 socket 的状态，避免旧连接关闭事件把新连接又打回 connecting。

3. 优化 `CoachVoiceChat.tsx` 的 PTT 首次连接体验
   - 连接中不再把它当作“网络波动”。
   - “网络波动，正在自动恢复”只在已经成功通话后、真实断线重连时显示。
   - 首次接通超过合理时间仍未成功时，给出明确提示并允许重新点击。

4. 部署并验证
   - 部署 `miniprogram-voice-relay` 后端函数。
   - 查看函数日志，确认不再出现 `beta_api_shape_disabled`。
   - 验证手机端状态流：按住语音 → 接通 → 松开发送 → AI 回复，不再进入循环。