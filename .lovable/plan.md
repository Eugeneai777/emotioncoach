## 优化目标

在 `https://wechat.eugenewe.net/emotion-coach` 中，用户点击麦克风语音输入后，识别结果统一回填为中文简体，避免出现“時局、新聞、會”等繁体字；同时不改变现有录音、扣费、识别、错误提示、发送消息、简报生成等逻辑。

## 现状判断

当前语音输入链路是：

```text
用户录音
  -> voice-to-text 后端函数调用语音识别
  -> 前端 VoiceInputButton 收到 data.text
  -> 写入 CoachInputFooter 输入框
  -> 用户点击发送
```

问题出在语音识别模型返回的 `data.text` 可能混入繁体字。最稳妥的优化点是在“识别完成后、写入输入框前”做一次简体归一化，不改识别接口、不改聊天接口、不改简报生成逻辑。

## 实施方案

1. 新增一个轻量文本工具
   - 新建 `src/utils/chineseText.ts`
   - 提供 `normalizeToSimplifiedChinese(text: string): string`
   - 使用内置繁简映射表处理常见繁体字、异体字与用户截图中出现的问题，例如：
     - `時 -> 时`
     - `會 -> 会`
     - `聞 -> 闻`
     - `謝 -> 谢`
     - `國 -> 国`
     - `這 -> 这`
     - `為 -> 为`
     - `與 -> 与`
     - `還 -> 还`
     - `後 -> 后`
   - 保留标点、英文、数字、emoji、用户原句结构不变。

2. 在语音输入组件统一处理
   - 修改 `src/components/coach/VoiceInputButton.tsx`
   - 在 `data?.text` 返回后先执行：
     ```ts
     const normalizedText = normalizeToSimplifiedChinese(data.text);
     onTranscript(normalizedText);
     ```
   - 这样所有使用 `VoiceInputButton` 的文字语音输入都会获得简体结果。
   - 现有 `showSuccessToast`、错误 toast、麦克风状态、扣费调用保持不变。

3. 后端提示词增强，降低源头返回繁体概率
   - 修改 `supabase/functions/voice-to-text/index.ts`
   - 在语音识别请求中加入 `prompt`，明确要求返回“简体中文，不使用繁体字”。
   - 继续保留 `language: 'zh'`、Whisper 模型、扣费流程和错误处理。

4. 兼容两个情绪文字教练
   - `/emotion-coach`：通过 `CoachLayout -> CoachInputFooter -> VoiceInputButton` 自动生效。
   - `/assessment-coach`：该页面也直接使用 `VoiceInputButton`，会同步获得简体化结果。
   - 不改变这两个页面已完成的“隐藏语音转换成功提示框”逻辑。

5. 验证
   - 执行 TypeScript 类型检查。
   - 用含繁体的测试字符串验证转换函数不会影响简体、英文、数字和 emoji。
   - 确认语音输入回填位置仍然是原输入框，用户仍可继续编辑后发送。

## 技术说明

优先采用“前端归一化 + 后端识别提示”的双保险：

- 后端 `prompt` 可以减少语音模型输出繁体的概率。
- 前端归一化可以保证即使模型偶尔返回繁体，进入输入框前也会被转成简体。
- 不引入新依赖，避免增加包体积与构建风险。
- 不改数据库、不改用户会话、不影响已有 AI 教练对话和简报生成流程。