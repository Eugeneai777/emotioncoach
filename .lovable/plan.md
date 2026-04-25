## 诊断结论

当前情绪文字教练的手机端麦克风并不是单纯权限问题，而是录音识别链路存在两个瓶颈：

1. 手机端进入的是 `MediaRecorder -> voice-to-text -> Whisper` 的录音分段识别模式，不是真正浏览器原生实时识别，所以天然会比电脑端慢。
2. 后台日志显示 `voice-to-text` 多次返回 OpenAI 400：`Invalid file format`。也就是说部分手机/微信 WebView 录出来的音频 MIME 或文件扩展名映射不正确，后台把它当成了不被识别的格式，因此前端统一显示“语音识别服务暂时不可用”。
3. 目前 6 秒分段上传一次，若 6 秒片段为空、格式不匹配、网络慢，就会让用户感觉“点了没反应/很慢/服务不可用”。

## 优化目标

- 不影响情绪教练、财富教练、语音教练等其他 AI 教练逻辑。
- 手机端点击麦克风后立即有明确状态反馈。
- 尽量缩短从说话到文字出现的等待时间。
- 避免因某一小段音频失败就中断整个语音输入。
- 修正后台音频格式识别，减少“服务不可用”的误报。

## 实施方案

### 1. 修复 `voice-to-text` 音频格式兼容

调整后台函数 `supabase/functions/voice-to-text/index.ts`：

- 对 `audio/webm;codecs=opus`、`audio/mp4;codecs=...` 等 MIME 做标准化。
- 修正扩展名映射：
  - `audio/webm` -> `.webm`
  - `audio/mp4` / `audio/x-m4a` -> `.m4a` 或 `.mp4`
  - `audio/mpeg` -> `.mp3`
  - `audio/ogg` / `audio/oga` -> `.ogg` 或 `.oga`
  - `audio/wav` -> `.wav`
- 对未知 MIME 不再盲目用 `.webm`，而是返回可读错误，并记录实际 MIME/文件大小，方便后续定位。
- 对过小或空音频片段直接返回 `{ text: "" }`，不再调用识别服务，避免无效 400。

### 2. 优化手机端分段策略，降低等待感

调整 `src/hooks/useRealtimeSpeechInput.ts`：

- 手机录音分段从 6 秒缩短到约 2.5-3 秒，让文字更快出现在输入框。
- 保留顺序队列，但单段失败不清空整个队列，只跳过失败片段并继续处理后续语音。
- 对“空片段/太短片段”静默忽略，不弹“服务不可用”。
- 前端错误提示区分：
  - 麦克风启动失败
  - 当前录音片段未识别到声音
  - 识别服务繁忙，请继续说或稍后再试
  - 浏览器不支持录音
- 点击停止时强制 flush 最后一段，减少最后一句话丢失。

### 3. 保持桌面端和其他教练不受影响

- 仍优先让桌面端使用 `SpeechRecognition` 原生实时识别。
- 仅在移动端、微信 WebView、HarmonyOS/ArkWeb 或原生识别失败时使用录音识别 fallback。
- 不改动财富文字教练现有按钮逻辑、不改动其他 AI 教练请求流程。
- 继续复用 `forceReleaseMicrophone()`，确保退出页面/停止录音时释放系统麦克风红点。

### 4. 改善输入框旁的状态反馈

调整 `AssessmentCoachChat.tsx`：

- 麦克风开启后立即绿色高亮，不等识别结果返回。
- 正在上传/识别时显示小 loading，但不禁用麦克风停止按钮，用户可随时停止。
- 文案从“语音识别服务暂时不可用”改为更准确的提示，例如“正在识别中，请继续说话”或“这一小段没有识别到清晰语音”。

## 技术细节

```text
手机端链路：
用户点击麦克风
  -> getUserMedia 立即拿麦克风
  -> MediaRecorder 每 2.5-3 秒产出音频片段
  -> 前端队列顺序上传 voice-to-text
  -> 后台标准化 MIME + 文件扩展名
  -> 识别成功后追加到输入框
  -> 单段失败只影响该片段，不中断整个录音
```

关键修改文件：

- `src/hooks/useRealtimeSpeechInput.ts`
- `src/components/emotion-health/AssessmentCoachChat.tsx`
- `supabase/functions/voice-to-text/index.ts`

## 验证方式

实施后会做以下验证：

1. 类型检查，确保前端编译无误。
2. 部署并测试 `voice-to-text` 后台函数。
3. 检查后台日志不再出现大量 `Invalid file format`。
4. 确认电脑端原生实时识别仍正常。
5. 确认手机/微信端点击后立即高亮，2.5-3 秒内开始回填文字，停止后麦克风释放。