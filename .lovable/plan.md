## 优化方案：隐藏语音转文字成功提示

### 目标
在以下两个页面中，用户点击麦克风并完成语音转文字后，不再弹出顶部提示框：

- `/emotion-coach` 情绪文字教练
- `/assessment-coach` 情绪测评后的文字教练

保留现有功能：

- 麦克风按钮仍正常显示。
- 录音、停止录音、语音识别仍正常。
- 识别出的文字仍自动填入输入框。
- 失败提示、未识别到语音提示、无麦克风权限提示仍保留，方便用户知道异常原因。
- 不影响财富教练、沟通教练、亲子教练等其他 AI 教练现有逻辑。

### 当前原因
`VoiceInputButton` 是共用语音输入组件。语音识别成功后会统一调用：

```ts
onTranscript(data.text);
toast({
  title: "语音转换成功",
  description: "已将语音转为文字",
});
```

所以每次成功识别都会出现提示框。对高频语音输入场景来说，这个成功提示会打断用户连续输入体验。

### 实施方案

1. **扩展共用语音按钮组件**
   - 在 `VoiceInputButton` 增加一个可选参数，例如：

```ts
showSuccessToast?: boolean
```

   - 默认值保持 `true`，确保其他页面不受影响。

2. **仅在两个情绪教练页面关闭成功提示**
   - `/emotion-coach` 通过 `CoachLayout -> CoachInputFooter -> VoiceInputButton` 链路传入关闭参数。
   - `/assessment-coach` 的 `AssessmentCoachChat` 直接使用 `VoiceInputButton`，传入关闭参数。

3. **保留异常提示**
   - 不改以下 toast：
     - 浏览器不支持语音录制
     - 无法访问麦克风
     - 未识别到语音
     - 语音转换失败
     - 微信环境下使用键盘语音输入的提示
   - 只隐藏“语音转换成功 / 已将语音转为文字”。

### 涉及文件

- `src/components/coach/VoiceInputButton.tsx`
  - 增加 `showSuccessToast` 可选属性。
  - 成功识别时仅在该属性为 `true` 时显示成功 toast。

- `src/components/coach/CoachInputFooter.tsx`
  - 增加透传属性，例如 `showVoiceInputSuccessToast`。

- `src/components/coach/CoachLayout.tsx`
  - 增加透传属性，例如 `showVoiceInputSuccessToast`。

- `src/pages/Index.tsx`
  - `/emotion-coach` 页面设置 `showVoiceInputSuccessToast={false}`。

- `src/components/emotion-health/AssessmentCoachChat.tsx`
  - `VoiceInputButton` 设置 `showSuccessToast={false}`。

### 验证方案

1. 在 `/emotion-coach` 点击麦克风，说话并停止录音。
2. 确认文字自动进入输入框。
3. 确认不再出现“语音转换成功 / 已将语音转为文字”提示框。
4. 在 `/assessment-coach` 重复验证。
5. 模拟识别失败或空音频，确认错误提示仍显示。
6. 检查其他使用语音输入的教练页面默认行为不变。
7. 运行 TypeScript 检查，确认无类型错误。