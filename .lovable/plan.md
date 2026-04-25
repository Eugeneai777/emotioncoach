问题判断：这不是你手机麦克风权限真的没开，而是当前情绪文字教练只依赖浏览器内置的 `SpeechRecognition / webkitSpeechRecognition`。它在电脑 Chrome 正常，但在微信内置浏览器、鸿蒙/部分安卓 WebView 中会返回 `not-allowed` 或静默失败，即使系统和微信权限已经开启，也不会真正拉起语音识别。因此现在的提示“麦克风权限未开启”是误导性的。

Do I know what the issue is? 知道。核心问题是把“语音识别服务不可用/被 WebView 禁用”误判成了“麦克风权限未开”，并且缺少手机端可靠降级方案。

修复方案如下：

1. 保留电脑端现有实时语音输入
   - 桌面 Chrome 等支持 Web Speech API 的环境继续使用当前实时识别方案。
   - 不改动财富教练、语音通话教练、训练营、支付等其他逻辑。

2. 给手机端增加可靠的录音转文字降级通道
   - 在微信/鸿蒙/移动端环境中，不再只依赖 `webkitSpeechRecognition`。
   - 点击麦克风后，优先用标准麦克风采集能力 `navigator.mediaDevices.getUserMedia + MediaRecorder` 获取真实音频流。
   - 麦克风真正启动后按钮立即高亮绿色，表示正在听。
   - 再次点击停止录音，并把录音发送到已有的语音转文字后端能力，识别结果自动填入输入框。

3. 尽量接近实时，而不是“点了没反应”
   - 对手机端采用短分段录音队列：录音期间按小片段采集并排队识别，识别出的文字逐步追加到输入框。
   - 避免多个识别请求并发造成乱序、重复或卡顿。
   - 如果网络慢，会显示“正在识别中”，不会误提示权限没开。

4. 修正错误提示文案
   - `not-allowed` 不再一律显示“麦克风权限未开启”。
   - 区分以下情况：
     - 浏览器不支持语音识别：提示“当前微信/手机浏览器不支持原生实时语音识别，已切换录音识别模式”。
     - 真实麦克风拒绝：提示检查系统/微信权限。
     - 识别服务失败：提示网络或识别服务异常，可重试。
     - 未识别到声音：提示靠近麦克风重新说一遍。

5. 强化麦克风生命周期，避免后台占用
   - 停止录音、发送消息、页面隐藏、组件卸载时硬释放麦克风。
   - 遵循项目已有麦克风释放标准，避免手机状态栏一直显示录音中。

6. 后端语音转文字兼容性优化
   - 复用现有 `voice-to-text` 后端能力。
   - 补充支持前端传入实际音频格式，例如 `audio/webm` 或 `audio/mp4`，避免移动端录出来的格式被后端固定当成 webm 处理导致识别失败。

7. 验证范围
   - TypeScript 检查通过。
   - 重点验证：
     - 电脑端仍能实时转文字。
     - 手机微信/鸿蒙环境点击麦克风会高亮并进入录音/识别状态。
     - 权限已开时不再误报“权限未开启”。
     - 停止后文字进入输入框，发送消息逻辑不受影响。
     - 其他 AI 教练不受影响。

涉及文件预计：
- `src/hooks/useRealtimeSpeechInput.ts`：改为 Web Speech + 手机录音识别双通道。
- `src/components/emotion-health/AssessmentCoachChat.tsx`：更新按钮状态、提示、发送时停止录音。
- `supabase/functions/voice-to-text/index.ts`：兼容不同音频 MIME 类型。

<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>