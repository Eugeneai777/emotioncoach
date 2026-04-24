

## 问题
手机端 AI 语音教练挂断、甚至关闭小程序/页面后，系统状态栏左上角仍显示「麦克风通话中」红色胶囊（截图所示）。这意味着浏览器/WebView 进程仍持有未释放的麦克风轨道（`MediaStreamTrack`），iOS/Android 系统据此判定"仍在录音"。

## 根因分析（基于代码审查）

`src/utils/microphoneManager.ts` 采用了"全局共享 stream + 跨会话复用"策略：
- 整个 App 生命周期内只创建一份 `globalStream`，多次 `acquireMicrophone()` 都返回同一份 stream；
- `releaseMicrophone()` 默认**只是 `track.enabled = false`**，并不调用 `track.stop()`；
- 真正释放需要显式 `forceReleaseMicrophone()`。

`CoachVoiceChat` 在挂断 / 卸载时调用的多半是普通 `releaseMicrophone()`，而不是 `forceReleaseMicrophone()`，导致：
1. 通话结束后 track 仍处于 `live` 状态，仅 `enabled=false`；
2. iOS 系统 / 微信 WebView 不识别 `enabled=false`，只看 track 是否 `stop()`，因此左上角红点持续存在；
3. 即便用户离开页面、回到小程序首页，只要 WebView 进程还活着，红点就一直挂着；只有彻底杀掉小程序进程才会消失。

次要因素：
- `useVoiceSessionLock` 释放与 mic 释放未联动；
- `pagehide` / `visibilitychange='hidden'` / `beforeunload` 没有兜底强制 stop；
- WebRTC `RTCPeerConnection` 的 sender track 若未单独 `sender.track.stop()` 也会让浏览器维持"录音中"的判定。

## 修复方案

### 1. 挂断路径强制 stop（核心）
在 `CoachVoiceChat` 的挂断 / cleanup / unmount 路径里，把 `releaseMicrophone()` 改为 `forceReleaseMicrophone()`，并在 `RTCPeerConnection` 关闭前先：
```ts
pc.getSenders().forEach(s => { try { s.track?.stop(); } catch {} });
pc.getReceivers().forEach(r => { try { r.track?.stop(); } catch {} });
```
然后再 `pc.close()`。

### 2. `microphoneManager` 增加"会话级硬释放"
新增 `releaseMicrophoneHard(sessionId)`：当当前 session 是最后一个引用时，自动调用 `forceReleaseMicrophone()`（即 `track.stop()` + `globalStream = null`）。`CoachVoiceChat` 改为调用此方法，避免下次别处复用时拿到一份"假活"的 stream。

### 3. 全局兜底：页面/进程退出时硬释放
在 `App.tsx` 或 `main.tsx` 注册一次性监听：
```ts
const hardKill = () => forceReleaseMicrophone();
window.addEventListener('pagehide', hardKill);
window.addEventListener('beforeunload', hardKill);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // 仅当不在通话中才硬释放，避免误杀正在进行的会话
    if (!hasActiveSession()) forceReleaseMicrophone();
  }
});
```

### 4. 联动会话锁
在 `useVoiceSessionLock.release()` 内部，调用方释放锁时同步触发 mic 硬释放（仅当无其它持有者）。

### 5. 自检日志
挂断后 1 秒打印 `globalStream?.getAudioTracks().map(t => ({enabled:t.enabled, readyState:t.readyState, label:t.label}))`，便于复测确认每条 track 都进入 `ended` 状态。

## 改动文件
- `src/components/coach/CoachVoiceChat.tsx`：挂断 / cleanup / 路由离开 → 强制 stop sender/receiver track + 调用硬释放。
- `src/utils/microphoneManager.ts`：新增 `releaseMicrophoneHard()`，并修正 `releaseMicrophone()` 的引用计数语义；`forceReleaseMicrophone()` 内确保 `track.stop()` 在 `globalStream = null` 之前执行。
- `src/hooks/useVoiceSessionLock.ts`：`release()` 触发 mic 硬释放回调（通过事件或可选参数）。
- `src/main.tsx`：注册 `pagehide` / `beforeunload` / `visibilitychange` 全局兜底。

## 不改动
- PTT 模式录音逻辑、计费逻辑、UI 结构、Edge Function 不变；
- 不影响连续通话期间的麦克风复用性能（通话内仍可 `enabled=false` 静音，结束才硬 stop）。

## 验证方式
微信内 H5 / 小程序 WebView：
1. 进入 `/life-coach-voice`、`/xiaojin/voice` 通话 30 秒；
2. 点击挂断；
3. 系统状态栏左上角红色麦克风图标应在 1–2 秒内消失（而非一直挂到杀进程）；
4. 重新进入通话仍可正常拿到麦克风权限（验证未破坏复用）。

