

## 评估：电脑端 PTT 体验优化为"自适应通话模式"

### 商业架构视角

| 维度 | 手机端 PTT | 电脑端 PTT | 电脑端连续通话 |
|---|---|---|---|
| 自然交互 | ✅ 微信/对讲机肌肉记忆 | ❌ 鼠标长按违反习惯 | ✅ 类似 Zoom/Teams |
| 工程稳定性 | ✅ 触屏 Pointer 事件成熟 | ⚠️ 鼠标长按事件链条脆弱 | ✅ 一次性 start/stop |
| 误操作率 | 低 | 高（鼠标抬起即断） | 低 |
| 用户预期 | 短指令、快速来回 | 沉思、长描述、边打字边说 | 长对话 |
| 与竞品一致 | 微信语音 | — | ChatGPT 桌面版、Claude Voice |

**结论**：建议采纳。电脑端用户使用语音教练的场景多为「办公桌前长时间倾诉」，连续通话模式更贴合；手机端 PTT 模式保留，符合移动端"碎片化短指令"习惯。

### 一、设备识别策略

**新增工具函数** `src/utils/platform.ts`（已存在该文件）增加 `isDesktop()`：
- 判定逻辑：`!('ontouchstart' in window) && !navigator.maxTouchPoints && window.matchMedia('(hover: hover) and (pointer: fine)').matches`
- 兼容：iPad Pro 触屏笔记本仍归为"移动端"（有 touch），二合一 Surface 优先按 hover+fine pointer 判
- 微信小程序 WebView：永远归为"移动端"（有 touch）

### 二、CoachVoiceChat 自适应分发

**文件**：`src/components/coach/CoachVoiceChat.tsx`

1. 新增 `effectivePttMode = pttMode && !isDesktop()`，全组件内所有 `pttMode` 判断改为 `effectivePttMode`
2. 电脑端进入 `/life-coach-voice` 时：
   - **不显示** PushToTalkButton + "按住说话" 提示 + PTT 字幕区
   - **改为显示** 标准连续通话 UI：大圆形麦克风按钮（点击切换静音）+ 通话时长 + 实时字幕 + 挂断按钮（复用现有非 PTT 分支布局）
   - 余额胶囊「8 点/分钟 · 余额 X 点（约 Y 分钟）」+ 充值按钮：两种模式下都显示
3. 手机端 / 微信小程序：行为完全不变，继续用 PTT

### 三、底层音频路径

**不动** `MiniProgramAudio.ts` 的 PTT 接口 (`pttStart/pttStop`)。

电脑端连续通话使用现有 `RealtimeAudio.ts` 路径（VAD 自动收发，已稳定运行于其他教练页面）。

`CoachVoiceChat.tsx` 内根据 `effectivePttMode` 选择实例化 `MiniProgramAudio`（PTT）或 `RealtimeAudio`（连续）—— 这是当前代码已有的分支逻辑，仅需把"是否走 PTT"的判定从 `pttMode` 改为 `effectivePttMode`。

### 四、UI 文案差异

| 元素 | 手机 PTT | 电脑连续 |
|---|---|---|
| 主按钮 | 红色圆形「按住说话/松开发送」 | 紫色圆形麦克风「点击静音/取消静音」 |
| 提示行 | "按住说话发送给 AI" | "连续通话中，AI 会自动识别你的停顿" |
| 计费 | 8 点/分钟 | 8 点/分钟（一致） |
| 余额 | 字幕区下方胶囊 | 字幕区下方胶囊（一致） |
| 充值入口 | 余额 < 3 分钟出现 | 余额 < 3 分钟出现（一致） |

### 五、兼容性 & 边界

- **iPad / Surface**：通过 hover+pointer 检测，触屏优先 PTT，外接键鼠场景退化为 PTT 也可接受
- **窗口缩放**：`isDesktop()` 仅在组件挂载时计算一次，避免响应式误切换打断通话
- **测试帐号 / 演示**：可在 URL 加 `?force=ptt` 或 `?force=continuous` 强制覆盖，方便客服远程支持

### 涉及文件
- `src/utils/platform.ts`（新增 `isDesktop()` 导出）
- `src/components/coach/CoachVoiceChat.tsx`（`effectivePttMode` 分发 + 文案差异）

### 不涉及
- `MiniProgramAudio.ts`（PTT 路径完全不动）
- `RealtimeAudio.ts`（连续通话路径完全不动）
- `PushToTalkButton.tsx`（保留给手机端使用）
- 其他教练页面、计费、token、edge function

### 验收
1. 电脑端浏览器（Chrome/Edge/Safari/Firefox）打开 `/life-coach-voice` → 显示标准连续通话 UI（麦克风按钮 + 字幕 + 挂断），无 PTT 按钮
2. 手机浏览器 / 微信小程序 → PTT 长按模式不变
3. 两种模式都能正常显示「余额 X 点 · 约 Y 分钟」，余额低时弹充值
4. iPad 触屏 → PTT 模式（符合触屏体验）
5. 加 `?force=continuous` → 任意设备强制连续通话；`?force=ptt` → 强制 PTT
6. 其他教练页面（财富/沟通/情绪）行为完全不变

