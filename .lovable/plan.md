# 智能语音挂断失效 — 根因与修复

## 现象
路由 `/life-coach-voice?ref=share`,用户连接成功后点"挂断"按钮无任何反应,通话计时器继续走(session 截图为 0:35)。控制台没有 `[VoiceChat] 挂断 clicked` 日志,但有持续每秒的 `Reconnecting within ...ms`。

## 根因

`src/pages/LifeCoachVoice.tsx` 把关闭回调写成:
```ts
<CoachVoiceChat onClose={() => navigate(-1)} ... pttMode />
```

而 `CoachVoiceChat` 在 PTT 模式下挂断分支(行 2477-2484)执行:
```ts
chatRef.current?.disconnect();
releaseLock();
onClose();        // → navigate(-1)
```

用户从分享链接直接打开页面,**浏览器历史栈里没有上一页**,`navigate(-1)` 静默失败,组件不卸载,WebRTC 虽然断开但 UI 仍停留在通话界面,用户感知就是"挂不掉"。同样问题存在于:
- `src/pages/WealthCoachVoice.tsx`(2 处 `navigate(-1)`)
- 任何通过分享/小程序 webview 直接落地的语音页

(顺便:控制台每秒刷 `Reconnecting within Xms` 是因为 `getOrCreateSessionId()` 写在 render body 里,每次 duration tick 都会重读 localStorage 并打 log。属于日志噪音,不影响功能,顺手清理。)

## 修复方案

### 1. 新增统一的"安全返回"工具 `src/utils/safeNavigateBack.ts`
```ts
export function safeNavigateBack(navigate, fallback = '/') {
  // history.state.idx === 0 表示当前是历史栈起点(分享/直链落地)
  const idx = (window.history.state as any)?.idx;
  if (typeof idx === 'number' && idx > 0) {
    navigate(-1);
  } else {
    navigate(fallback, { replace: true });
  }
}
```

### 2. 接入语音页关闭回调
- `src/pages/LifeCoachVoice.tsx`:`onClose={() => safeNavigateBack(navigate, '/')}`
- `src/pages/WealthCoachVoice.tsx`:两处 `navigate(-1)` 同样替换,fallback 用 `/coach/wealth_coach_4_questions` 的入口或 `/`。

### 3. 顺手清理日志噪音(可选,低风险)
`src/components/coach/CoachVoiceChat.tsx` 行 310-312 的 `console.log('Reconnecting within ...')` 只在真正命中复用分支的"首次"打印,而不是每次 render。做法:把首次值缓存到 `useRef` 中,值不变则不再打 log。

## 不在本次范围
- 不修改 WebRTC / 计费 / RLS 任何业务逻辑
- 不调整 PTT 按钮样式或交互
- 不动 CoachVoiceChat 的挂断流程本身(它已正确调用 onClose)

## 验证
- 在新标签直接打开 `/life-coach-voice?ref=share`,连接成功后点挂断 → 应跳到 `/`,通话计时停止。
- 正常从 App 内点进语音页(有历史栈)→ 行为不变,仍 `navigate(-1)`。
- 控制台不再每秒刷 `Reconnecting within`。
