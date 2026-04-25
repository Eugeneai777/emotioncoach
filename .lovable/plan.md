## 现状判断

`/assessment-coach` 使用的是独立组件 `AssessmentCoachChat.tsx`，没有走财富文字教练使用的统一 `CoachLayout + CoachInputFooter + VoiceInputButton` 输入栏，所以第二张图的麦克风确实缺失。

财富文字教练 `/wealth-coach-chat` 已通过 `CoachInputFooter` 开启 `enableVoiceInput={true}`，旁边会显示麦克风。当前已有 `VoiceInputButton`，但它是“录一段 -> 停止 -> 后端识别”的批量转写，不是用户要求的“实时显示到输入框”。

## 优化目标

1. 恢复 `/assessment-coach` 情绪文字教练输入框左侧麦克风，位置和财富文字教练一致。
2. 点击麦克风后高亮绿色，开始监听用户语音。
3. 语音内容实时转成文字，持续显示在输入框中。
4. 再次点击麦克风取消高亮并停止读取语音。
5. 不改动现有 AI 教练消息发送逻辑、训练营逻辑、财富教练逻辑和语音通话逻辑。

## 架构方案

新增一个独立、可复用的“实时语音输入 hook”，只负责“麦克风 -> 文字输入框”，不介入教练对话业务：

```text
AssessmentCoachChat
  input state
  handleSend()
  useRealtimeSpeechInput()
        |
        | onTranscript(text)
        v
  setInput(text)
```

### 1. 新增 `useRealtimeSpeechInput` hook

职责：
- 封装浏览器原生 SpeechRecognition / webkitSpeechRecognition。
- 设置中文识别：`zh-CN`。
- 开启 `continuous = true` 和 `interimResults = true`。
- 把临时识别结果实时写入输入框，最终识别结果稳定追加。
- 暴露状态：`isListening`、`isSupported`、`toggleListening()`、`stopListening()`。
- 组件卸载、页面隐藏时自动停止识别，避免麦克风占用残留。

优点：
- 不依赖财富教练的业务逻辑。
- 不影响 `CoachInputFooter` 当前已使用的语音输入。
- 后续如果要把财富教练也升级为实时转写，可以复用同一个 hook。

### 2. 在 `AssessmentCoachChat.tsx` 中恢复麦克风按钮

在现有输入区域中，把结构从：

```text
[Textarea] [Send]
```

改为：

```text
[Mic] [Textarea] [Send]
```

交互样式：
- 默认：浅色圆形按钮，灰色麦克风图标。
- 监听中：绿色高亮背景/边框，麦克风图标绿色或白色，并轻微 pulse，表示正在收音。
- 加载中或已生成简报后禁用/隐藏，保持现有对话流程不变。

### 3. 输入框实时更新策略

为避免“实时识别覆盖用户手动输入”，采用安全拼接策略：

- 点击麦克风时记录当前输入框内容作为 `baseText`。
- 识别过程中显示：`baseText + finalTranscript + interimTranscript`。
- 用户再次点击停止后，保留最终文字在输入框。
- 用户仍可手动编辑输入框，再点击发送走原有 `handleSend()`。

### 4. 兼容与降级

- 如果当前 WebView/浏览器不支持 SpeechRecognition，不显示麦克风按钮，避免出现无效按钮。
- 如果用户拒绝麦克风权限，显示中文提示，不影响文字输入。
- 微信内置浏览器支持情况不稳定：优先使用浏览器原生实时识别；不支持时自动降级为只显示文字输入框。

### 5. 不影响其他 AI 教练的保护措施

本次只改：
- 新增独立 hook/组件（无副作用）。
- 修改 `AssessmentCoachChat.tsx` 输入栏。

不改：
- `CoachLayout`。
- `CoachInputFooter`。
- `VoiceInputButton`。
- `/wealth-coach-chat`。
- `/coach/:coachKey` 动态教练。
- AI 语音通话相关 `CoachVoiceChat`、RealtimeAudio、Doubao 备用通道。

这样可以确保恢复情绪文字教练麦克风，同时不改变其他教练现有逻辑。

## 验证计划

实施后会检查：
1. TypeScript 编译通过。
2. `/assessment-coach` 输入框左侧出现麦克风。
3. 点击后按钮高亮绿色，再次点击恢复普通状态。
4. 输入框仍可手动输入、快捷选项仍可填入、发送按钮仍按原逻辑工作。
5. `/wealth-coach-chat` 现有麦克风仍存在且不受影响。