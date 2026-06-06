## 目标

将 `mini-app` 首页"想说点什么？按住和有劲AI说"区块中的语音教练入口，从当前的"在当前页弹出全局语音浮层 (`useGlobalVoice().startVoice`)"模式，改为与情绪教练入口一致的"直接跳转独立页面"模式 —— 即点击卡片直接 `navigate('/life-coach-voice?topic=...')`，由 `LifeCoachVoice` 页面承接后续逻辑。

不改动任何业务逻辑、token endpoint、scenario 映射、音色配置、AI 模型参数等。

## 改动范围

仅修改一个文件：`src/pages/MiniAppEntry.tsx`

### 具体修改

1. `handleUseCaseClick(topic)` 简化为：
   - 未登录：`navigate('/auth?redirect=/life-coach-voice?topic=' + topic)`（保留原有逻辑）
   - 已登录：`navigate('/life-coach-voice?topic=' + topic)`
2. 删除 `useGlobalVoice` 调用与 `startVoice(...)` 整段配置。
3. 删除本文件中不再使用的导入：
   - `useGlobalVoice`（from `@/components/voice/GlobalVoiceProvider`）
   - `getSavedVoiceType`（from `@/config/voiceTypeConfig`）
   - `TOPIC_TO_SCENARIO_KEY` 本地常量（场景映射由 `LifeCoachVoice.tsx` 内部已有的同名映射处理，不影响行为）
4. 卡片上 `onPointerDown={() => preloadRouteOnIntent('/life-coach-voice?topic=' + c.topic)}` 保留，预加载行为不变。

## 不改动

- `LifeCoachVoice.tsx`、`CoachVoiceChat.tsx`、`vibrant-life-realtime-token` edge function、`MiniProgramAudio.ts`、`GlobalVoiceProvider`、音色 / scenario / 预热逻辑全部保持原样。
- 其它页面（YoujinLifeChat、FloatingVoiceButton 等）继续使用现有 `startVoice` 浮层模式，不受影响。

## 预期效果

mini-app 中点击场景卡 → 像点击"情绪教练"那样直接跳转到独立的 `/life-coach-voice` 页面（该页面本身已实现 token 预热、麦克风预热、scenario 解析），避免了在小程序 WebView 中通过全局浮层启动语音时遇到的连接初始化时序问题。