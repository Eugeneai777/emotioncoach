

## 目标
一次性修复 3 个问题，**严格不破坏现有业务逻辑**，手机端（含微信小程序）与电脑端排版/跳转兼容稳定：
1. 电脑端鼠标长按 PTT 按钮无反应
2. 顶部误报"连接失败"（实际通道仍活、文字仍在流）
3. PTT 模式余额 / 剩余通话时长 / 计费提示不显示

## 一、修复电脑端长按无反应

**文件**：`src/components/coach/PushToTalkButton.tsx`

- 事件源统一为 Pointer Events，移除 `onMouseDown/Up/Leave` + `onTouchStart/End/Cancel` 三套并存
- **删除 `onPointerLeave={handleUp}`**：桌面端按下瞬间 `scale-110` 动画导致 pointer 几何位置瞬时离开按钮 → 立即 stop。这是"按下即松开"元凶
- 依赖 `setPointerCapture` 锁定指针，鼠标移出按钮区仍持续录音
- 保留 `onPointerCancel` 处理系统级中断（来电、切窗）
- 新增 `window.pointerup` 全局兜底监听（按下时挂载、松开时卸载），防止 pointer capture 在个别浏览器失效导致卡死
- 不改 props / 不改 onStart / onStop 签名 → 调用方零改动

## 二、修复"连接失败"误判

**文件**：`src/utils/MiniProgramAudio.ts`

服务端 `error` message 需分级处理：
- **致命**（WebSocket 关闭 / token 失效 / 麦克风权限拒绝 / `error.code` 含 `session_expired` / `auth_failed`）→ 切 `status='error'`
- **非致命**（单帧解码失败 / `rate_limit` 警告 / 单次 response 错误 / `ws.readyState === OPEN` 且过去 3 秒内有 transcript 流入）→ 仅 console + 透传 `onMessage`，**不改 status**
- 判断字段：`message.error.code`、`message.error.type`，并增加 `lastTranscriptAt` 时间戳作为"通道活着"的兜底信号

## 三、修复 PTT 抢话副作用导致的"听不到声音"

**文件**：`src/utils/MiniProgramAudio.ts`

`audioMutedUntilNextResponse` 增加 3 条解锁路径（防止永久静音）：
- 已有：`response.created` → 复位
- **新增**：`response.audio.delta` / `audio_output` 首帧到达时，若距 `pttStop()` 已 > 1.5s，强制复位
- **新增**：`pttStop()` 启动 2s 兜底定时器，到点强制复位
- **新增**：`pttStart()` 仅打断当前播放队列，**不**永久禁播 —— 改为"软静音 1 个 response 周期"

## 四、PTT 模式余额可视化补齐

**文件**：`src/components/coach/CoachVoiceChat.tsx`

1. **顶部状态栏放宽渲染条件**：`L2295` 从 `status === 'connected'` 改为 `(status === 'connected' || 'connecting' || 'error') && !skipBilling && remainingQuota !== null` —— 连接中 / 失败时仍能看到「余额 X 点 · 约 Y 分钟」
2. **PTT 分支补齐余额胶囊**：上一轮余额行写在了非 PTT 的 `else` 分支（`L2446-2450`），现在搬到 PTT 分支字幕区下方，渲染：
   ```
   8 点/分钟 · 余额 X 点（约 Y 分钟）  [余额<3 分钟时右侧出现「充值」按钮]
   ```
   点击「充值」复用 `setShowRechargeDialog(true)`
3. **计费提示行**：`L2798` 改为 `pttMode && status !== 'idle'` 即显示，不再强依赖 `connected`
4. **新增「重连」按钮**：状态栏出现红字"连接失败"时右侧加小号「重连」（点击 → `startCall()`），不再让用户只能挂断

## 兼容性确认（手机 + 电脑）
- Pointer Events：iOS Safari / Android Chrome / 微信小程序 WebView / 桌面 Chrome/Edge/Safari/Firefox 全支持
- 视觉（红色按钮 / ping 动画 / "按住说话/松开发送" / 缩放反馈）100% 保持
- 顶部状态栏新增的余额 / 重连按钮在窄屏（<375px）使用 flex-wrap，不会撑破布局
- 余额胶囊在 PTT 字幕下方独立行，不挤压波纹和按钮区

## 涉及文件
- `src/components/coach/PushToTalkButton.tsx`（事件层重构）
- `src/utils/MiniProgramAudio.ts`（错误分级 + 静音兜底解锁）
- `src/components/coach/CoachVoiceChat.tsx`（PTT 余额胶囊 + 放宽显示条件 + 重连按钮）

## 不涉及
- `RealtimeAudio.ts`（普通语音通话路径，不动）
- 其他教练页面（财富 / 沟通 / 情绪等）
- 后端、计费逻辑、token 接口、edge function
- `QuotaRechargeDialog` 本身、`PttDiagnosticsPanel` 本身

## 验收
1. 电脑端鼠标按住 PTT → 立即变红、显示"松开发送"、开始录音；移出按钮区不中断；松开正确停止并发送
2. 手机 / 微信小程序长按行为与之前完全一致
3. 接通后顶部稳定显示「时长 · 已扣点 · **余额 X 点 · 约 Y 分钟** · 网络」
4. PTT 字幕区下方始终显示「8 点/分钟 · 余额 X 点（约 Y 分钟）」
5. AI 说话中长按打断 → 松开后下一句**能正常听见**（不再永久静音）
6. 服务端发非致命 error → 顶部不再红字「连接失败」，对话继续
7. 真的连接失败 → 顶部仍显示余额，右侧出现「重连」按钮，点击可恢复
8. 其他教练页面 UI 与行为完全不变

