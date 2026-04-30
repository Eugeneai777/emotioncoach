我会针对 `/emotion-coach` 语音教练先做“转写显示与输入过滤”优化，同时把同一套保护应用到其它 AI 语音教练共用的语音组件，避免韩文/英文/繁体/杂音误识别继续出现在用户字幕里，并减少错误文本进入后续简报。不会改购买、点数计费、通话结束、简报生成、页面路由等现有逻辑。

实施范围：

1. 增加语音转写清洗与过滤工具
   - 新增一个前端工具函数，用于统一处理语音转写文本：
     - 繁体转简体：例如「覺察」「情緒」显示为「觉察」「情绪」。
     - 过滤明显韩文文本：例如截图中的「오늘 영상은...」不会展示为用户发言。
     - 过滤明显非中文噪声误识别：如极短英文、无意义符号、背景音乐/环境音被识别出的片段。
     - 保留用户真实说出的中文内容；如用户确实混用少量英文，也尽量不误删正常中文句子。
   - 过滤只作用于“显示与本地记录的用户转写文本”，不改变通话连接、音频流、计费逻辑。

2. 更新 `CoachVoiceChat` 共用转写处理
   - 在 `handleTranscript` 里对 `role='user'` 的最终转写先进行清洗。
   - 如果清洗后为空，认为这是噪声或错误语言识别，不显示在「你：」字幕，也不写入 `userTranscript`。
   - 对 `role='assistant'` 的文本继续保留现有身份替换，同时补充繁体转简体，避免教练字幕出现繁体。
   - 这样 `/emotion-coach`、生活教练、亲子教练、小劲等复用 `CoachVoiceChat` 的 AI 语音教练都会获得基础保护。

3. 调整实时语音会话的语言与 VAD 参数
   - 在 `emotion-realtime-token` 中增加用户音频转写语言提示：`input_audio_transcription` 指定中文转写方向。
   - 将情绪教练 `server_vad` 稍微调得更抗噪：提高触发阈值、延长静音确认，减少环境杂音被当成一句话提交。
   - 同步检查其它 AI 语音教练使用的 `vibrant-life-realtime-token`、小程序中继 `miniprogram-voice-relay` 的转写配置，尽量统一中文语言提示与抗噪参数，避免只有情绪教练修复。

4. 小程序中继通道同步保护
   - 对微信小程序 / 鸿蒙小程序可能走的 WebSocket 中继通道，在后端 session 配置里加中文转写语言提示。
   - 保持 PTT 模式已有逻辑不变：如果客户端显式关闭服务端 VAD，则不覆盖它，避免影响“按住说话”。

5. 安全兜底与日志
   - 对被过滤的异常转写只做轻量 console 记录，便于以后排查，但不弹窗打扰用户。
   - 不把被判定为噪声/韩文/无意义英文的内容写入最终对话文本，减少后续情绪简报被污染。

技术细节：

- 主要修改文件预计包括：
  - `src/components/coach/CoachVoiceChat.tsx`
  - 新增或复用 `src/utils/chineseText.ts` / 新增语音转写清洗工具
  - `supabase/functions/emotion-realtime-token/index.ts`
  - `supabase/functions/vibrant-life-realtime-token/index.ts`
  - `supabase/functions/miniprogram-voice-relay/index.ts`
- 不修改自动生成文件：
  - `src/integrations/supabase/client.ts`
  - `src/integrations/supabase/types.ts`
- 不改数据库表结构，不改权限策略。

验证目标：

- 截图中类似韩文误识别不再显示在「你：」区域。
- 中文用户对话保持简体中文显示。
- 其它 AI 语音教练也不会明显出现韩文/繁体/噪声短句污染字幕。
- 语音连接、点数扣费、挂断、简报生成、微信小程序与普通浏览器通道保持现有行为。