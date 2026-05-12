
# 修复:智能语音无法挂断

## 根因(已从控制台日志锁定)

OpenAI Realtime 服务端报错:
`Missing required parameter: 'session.type'`

我们项目里所有 `session.update` 事件都缺少新版协议要求的 `session.type: "realtime"` 字段,导致 session 配置注入失败、连接进入半死状态;同时旧的 30 秒"会话复用窗口"逻辑会在用户点挂断后再次把同一个坏 session 拉起来,表现就是**点挂断没反应 / 挂了又自己回来 / 一直在 Reconnecting**。

## 改动点(只动 2 个文件)

### 1. `src/utils/RealtimeAudio.ts` — 给所有 session.update 加 `type`

3 处发送 `session.update` 的地方,session 对象内补 `type: 'realtime'`:

- L770–782 PTT 预设关 VAD
- L785–799 推送 `pendingSessionConfig`
- L1246 附近 后续动态 `session.update`(场景切换 / 音色变更等)

形如:
```ts
this.dc.send(JSON.stringify({
  type: 'session.update',
  session: { type: 'realtime', ...payload },
}));
```

### 2. `src/components/coach/CoachVoiceChat.tsx` — 主动挂断时清掉会话复用窗口

问题:用户点"挂断"后 `disconnect()` 跑了,但 `localStorage` 里的 session 还在 30 秒复用窗口内,任何重新 mount(StrictMode / 路由抖动 / 自动重试)都会触发 `getOrCreateSessionId()` 复用旧 session,看起来"挂不断"。

修法:
- 在所有**用户主动挂断**的入口(L2304、L2387、L2932 三处按钮 + 浮窗 endVoice)
  在 `isEndingRef.current = true` 之后、`chatRef.current?.disconnect()` 之前,
  清掉 `localStorage` 里的 `voice_session_*` 键,确保下次不会被 30 秒窗口复用。
- `getOrCreateSessionId()` 里加一个保护:如果 `isEndingRef.current === true` 直接返回新 session,不走复用分支。

### 3. 自检

- 重新进入 `/life-coach-voice`,确认控制台不再出现 `Missing required parameter: 'session.type'`
- 通话中点"挂断" → 状态秒切到 `disconnected`、不再有 `Reconnecting within Xms` 滚动
- 30 秒内再点"开始通话" → 新 session ID(不复用坏 session)
- PTT 模式按住说话仍正常(turn_detection 仍是 null)

## 不动的部分

- 计费 / 配额 / 麦克风释放(`forceReleaseMicrophone`)逻辑保持不变
- 30 秒会话复用窗口在"网络抖动意外掉线"场景仍然有效,只对"用户主动挂断"短路掉
