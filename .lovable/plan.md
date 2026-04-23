

## 目标
修复 PTT 抢话 Bug + 增加计费透明文案。**关键调整**：用户按下时只打断"语音播放"，但保留"文本气泡完整显示"，让用户能回看 AI 已经说过的内容。

## 一、PTT 抢话打断（精细化方案）

**文件**：`src/utils/RealtimeAudio.ts` + `src/components/coach/CoachVoiceChat.tsx`

用户按下按钮（`startRecording` 触发瞬间）执行：

1. **打断音频播放**（要做）
   - 本地：停止当前音频队列播放（清空 AudioContext queue / pause audio element）
   - 远端：发送 `output_audio_buffer.clear` → 让服务端停止继续推送剩余音频帧

2. **保留文本输出**（关键差异）
   - **不发送** `response.cancel`（如果发了，服务端会停止生成，文本也会断在半句）
   - 让 AI 当前这轮 response 在后台继续生成文本 delta
   - 前端继续接收 `response.text.delta` / `response.audio_transcript.delta` 事件，把完整文本写入聊天气泡
   - 但音频帧（`response.audio.delta`）到达时直接丢弃，不入播放队列

3. **状态标记**
   - 在 `RealtimeChat` 里加一个 `audioMutedUntilNextResponse` 标记，按下时置 true，下一次 `response.created` 时复位
   - 音频帧入队前判断该标记，true 则丢弃

**效果**：用户一按下 → AI 立即闭嘴 → 但聊天框里 AI 那条气泡的文字会继续补完 → 用户松开后 AI 正常回复新内容。

## 二、计费透明文案

**文件**：`src/components/coach/CoachVoiceChat.tsx`（PTT 模式分支）

在 PTT 按钮上方加一行小字（小字号、白色 60% 透明度）：
> 按通话时长计费 · 8 点/分钟

仅 PTT 模式显示，不影响普通语音通话。

## 验收
1. AI 正在说话 → 长按语音条 → **声音立刻停止**，但聊天气泡里那段话的**文字继续补全**到完整
2. 松开后 AI 正常回复新内容，前一条文本完整保留可回看
3. PTT 界面能看到"按通话时长计费 · 8 点/分钟"
4. 普通语音通话模式行为不变

## 涉及文件
- `src/utils/RealtimeAudio.ts`（增加音频静音标记 + 清空播放队列 + 发 output_audio_buffer.clear）
- `src/components/coach/CoachVoiceChat.tsx`（PTT 模式调用打断 + 增加计费提示文案）

## 不涉及
- 后端计费逻辑（仍按总连接时长 8 点/分钟）
- 普通语音通话模式
- 其他教练页面
- token 接口

