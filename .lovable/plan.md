

## 在 PTT 通话界面中央显示实时对话文字

### 目标
通话过程中，屏幕中央实时显示双方对话文字（用户语音转写 + AI 回复文字），让用户清晰看到「我说了什么 / AI 回了什么」，提升信任感和可读性。

### 改造方案

**1. `src/utils/RealtimeAudio.ts` — 暴露转写文字事件**
- OpenAI Realtime 已经在数据通道里推送以下事件，目前未被向上转发：
  - `conversation.item.input_audio_transcription.completed` → 用户说的话（最终稿）
  - `response.audio_transcript.delta` → AI 回复的文字流（增量）
  - `response.audio_transcript.done` → AI 回复完结
- 在现有 `dc.onmessage` 处理里，把这三类事件通过 `onMessage` 回调透传出去（已有 `onMessage` 通道，无需新增 API）。

**2. `src/components/coach/CoachVoiceChat.tsx` — 中央字幕区**
- 新增本地 state：`userTranscript`（最近一句用户话）和 `aiTranscript`（AI 当前回复，按 delta 累加）。
- 在现有 `onMessage` handler 里根据事件类型更新对应 state；AI 新一轮回复开始时清空旧 `aiTranscript`。
- 在 PTT 模式主区中央渲染一个**字幕卡**（替换当前空白主区）：
  - 上半行：`你：xxxxx`（白色 70% 透明，text-sm，淡入）
  - 下半行：`教练：xxxxx`（玫红 90%，text-base，光标闪烁表示正在输出）
  - 最长 3 行截断，超出滚动到底部，自动隐藏 8s 内无更新的旧内容
  - 空闲（无任何转写）时显示灰色提示：`按住下方按钮 · 和教练说说`
- 字幕区位于顶栏下方到 PTT 按钮之间的中部空间，左右 padding-x-6，max-w-md 居中。

**3. 不动**
- 计费、PTT 录音逻辑、网络徽章、挂断流程
- 非 PTT 模式（其它教练入口）渲染分支

### 涉及文件
- `src/utils/RealtimeAudio.ts`（透传 3 个转写事件）
- `src/components/coach/CoachVoiceChat.tsx`（中央字幕组件 + state 管理）

### 验证清单
- [ ] 按住说话松开后 1-2 秒内，屏幕中央出现「你：…」自己说的话
- [ ] AI 回复时「教练：…」逐字流式出现
- [ ] 多轮对话时只显示最近一轮，不堆积
- [ ] 空闲态显示提示文案，不留白屏

