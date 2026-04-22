

## 把"开始对话"按钮改为「直接进入有劲AI语音教练 · Push-to-Talk」

### 用户体验

- 点击底部凸起按钮（"开始对话"）→ 不再进入文字对话页 `/youjin-life/chat`，而是直接进入 `/life-coach-voice` 全屏语音教练（已有页面 `LifeCoachVoice.tsx`，挂载 `CoachVoiceChat` + 心形 ❤️ 红玫瑰主题）
- 进入即自动接通；接通后**默认 PTT 模式**：麦克风默认静音、屏幕中央 1 个大圆按钮"按住说话 / 松开发送"，移植自 detective-superman-ai
- 文字按钮去掉，专注语音；保留挂断/返回按钮
- 按钮文案微调："开始对话" → "语音教练"，更贴合实际行为

### 技术方案

**1. 修改路由跳转 — `src/components/awakening/AwakeningBottomNav.tsx`**
- L48：`navigate('/youjin-life/chat')` → `navigate('/life-coach-voice')`
- L57：底部小字 "开始对话" → "语音教练"

**2. 给 `RealtimeChat` 增加 PTT 能力 — `src/utils/RealtimeAudio.ts`**
移植 detective-superman-ai 的 `useRealtimeSession` 三个核心方法到 class 上：
```ts
public setPushToTalkMode(enabled: boolean)   // session.update {turn_detection: null} + 静音麦克风
public startRecording()                       // input_audio_buffer.clear + 取消静音
public stopRecording()                        // input_audio_buffer.commit + response.create + 静音；< 300ms 丢弃
```
- 通过 `localStream.getAudioTracks()[i].enabled` 控制麦克风开关
- 通过 `this.dc.send(...)` 发送 OpenAI Realtime 控制事件
- 复用现有 `pc / dc / localStream` 实例，不破坏现有 VAD 流程

**3. `CoachVoiceChat` 增加 `pttMode` prop — `src/components/coach/CoachVoiceChat.tsx`**
- 新增 prop：`pttMode?: boolean`
- 连接成功后：如果 `pttMode=true`，调用 `client.setPushToTalkMode(true)`
- 渲染层：`pttMode=true` 时隐藏现有的常规通话按钮组，渲染一个**大型 PTT 按钮**：
  - `onPointerDown` → 震动 + `client.startRecording()`
  - `onPointerUp / onPointerCancel / onPointerLeave` → `client.stopRecording()`
  - 录音中：红色脉冲圆 + 实时音量条（复用现有 `AudioWaveform` 或简化版）
  - 空闲：玫红色呼吸光圈 + "按住说话"
- 顶部保留挂断按钮、计时与剩余额度提示

**4. `LifeCoachVoice.tsx` 开启 PTT**
- `<CoachVoiceChat ... pttMode />`

### 不改动
- `vibrant-life-realtime-token` 边缘函数无需改：PTT 模式由前端通过 `session.update` 动态切换 `turn_detection: null`
- 计费逻辑（`useVoiceBilling` / 8 点/分钟）保持不变
- 其它语音入口（小劲、财富教练等）保持现有 VAD 模式不受影响

### 验证点
- [ ] 点击底部凸起按钮直接进入 `/life-coach-voice`
- [ ] 进入后默认 PTT，未按住时麦克风静音（避免环境音被采集）
- [ ] 按住说话 → 松开后 AI 才回应；< 300ms 误触提示"按久一点"
- [ ] 挂断/返回正常；扣费、剩余额度显示正常

