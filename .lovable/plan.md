## 问题诊断

截图显示用户在**微信小程序 webview**（顶部绿色胶囊+`miniprogram` UA），路由为 `mini-app`，使用 `CoachVoiceChat` + `pttMode`。手机端走的是 `MiniProgramAudioClient`（WebSocket relay），而非桌面端的 WebRTC。

定位到 3 个相互叠加的 bug：

### Bug 1：PTT 按钮在"连接中"被替换成"挂断"图标 → 用户感觉"按了没反应，立马出来挂断图标"

`CoachVoiceChat.tsx:2968`：
```tsx
{pttMode && statusRef.current !== 'connecting' ? <PushToTalkButton /> : <Button>{PhoneOff}</Button>}
```

小程序 + PTT 模式下走 `shouldDelayMiniProgramPttConnect` 分支（line 185, 2972-2979）：**首次按住 PTT 才触发 `startCall()`**。一旦 `startCall` 把 `status` 推到 `'connecting'`，PushToTalkButton 立即被换成大红色 PhoneOff 圆形按钮——这正是截图底部那个红色挂断图标。用户的真实操作是：「按住语音」→ 看到自己按住的按钮消失，变成挂断图标 → 以为按错了。

### Bug 2：WebSocket 重连后无条件开启常驻录音，破坏 PTT 闸门

`MiniProgramAudio.ts:1336-1340`：
```ts
this.connect().then(() => {
  this.reconnectAttempts = 0;
  this.startRecording(); // ❌ 无视 pttPreset，重连后强制录音
});
```

PTT 模式下重连完成会触发录音常开，加上 relay 端 VAD 已被 `presetPushToTalk(true)` 关闭，造成"录音在跑但无 VAD/无回应"——对应"没反应"症状。

### Bug 3："网络波动，正在自动恢复…" 横幅在 PTT 等待按下时仍显示

横幅条件：`status === 'connecting' && hasEverConnectedRef.current`。微信小程序在切到挂起/前后台、移动数据切换 WiFi 时，WebSocket 会被 webview 静默 close，触发 `handleDisconnect → updateStatus('connecting')`，但此时用户并未在通话——横幅误报。截图里出现这个橙条说明用户之前已经成功连过一次。

---

## 修复方案

### 1. PTT 按钮在"连接中"保持可见，加 loading 反馈（核心修复）

`src/components/coach/CoachVoiceChat.tsx:2968`：
- 改成 PTT 模式下始终渲染 `PushToTalkButton`（仅在 `status === 'connecting'` 时给按钮加 `isConnecting` 视觉态：转圈 + "正在接通…"文案 + 禁用 `onStop` 误触退出）。
- `statusRef.current` 是 ref，不会触发 re-render，本身也是问题 → 改用 `status` state。
- 通用红色挂断按钮**只保留在非 PTT 路径**，PTT 路径下挂断只走顶栏右上「挂断」胶囊。

### 2. PushToTalkButton 适配 connecting 态

`src/components/coach/PushToTalkButton.tsx` 增加 `isConnecting?: boolean` 与 `isDisabled?: boolean`：
- connecting 态：按钮变灰、显示 `Loader2`、文字"正在接通…"、`onStart`/`onStop` 直接 return。
- 在 `shouldDelayMiniProgramPttConnect` 首次按下并触发 `startCall()` 后，立即给一次震动 + Toast"接通中，请保持按住"以解释延迟。

### 3. 修复 WebSocket 重连后录音状态错误

`src/utils/MiniProgramAudio.ts:1336-1348`：
```ts
this.connect().then(() => {
  this.reconnectAttempts = 0;
  if (!this.pttPreset) this.startRecording();  // PTT 模式下交给用户按下触发
});
```

### 4. 修复"网络波动"误报

`CoachVoiceChat.tsx:2378`：
- 横幅条件加 `&& !pttMode` 或 `&& chatRef.current` 守卫；或在 `handleStatusChange` 里仅当 `chatRef.current` 仍存在且不是"PTT 等待用户按下"语义时才置 `isSilentReconnecting=true`。
- 同时把 `setIsSilentReconnecting(true)` 加 2s 防抖，避免瞬时 connecting→connected 抖动。

### 5. 微信小程序后台恢复时主动校验 WebSocket（防止持续重连）

`MiniProgramAudio.ts` 已有 `setupVisibilityListener`，但当前只恢复 AudioContext。补：`document.visibilityState === 'visible'` 时若 `ws.readyState !== OPEN` 立即触发一次主动 `connect()`，避免等心跳 100s 才发现连接死掉。

---

## 涉及文件

- `src/components/coach/CoachVoiceChat.tsx`（2968 行附近 + 2378 行横幅条件 + 1010 静默重连防抖）
- `src/components/coach/PushToTalkButton.tsx`（新增 connecting/disabled 视觉）
- `src/utils/MiniProgramAudio.ts`（1336 重连录音守卫 + visibility 主动重连）

不动后端 / Edge Function / 数据库。

---

## 验证

部署后在手机微信小程序内打开 mini-app 入口语音通话：
1. 按住 PTT 按钮 → 应看到"正在接通…"loading，松开后不应误触挂断；接通后按住正常录音。
2. 切到后台 5 秒再切回 → 应在 1s 内自动恢复 WebSocket，不再长时间显示"网络波动"。
3. 弱网模拟（开关飞行模式）→ 重连后 PTT 仍可正常按住录音，不再常驻录音。
