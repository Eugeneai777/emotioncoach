

# /youjin-life/chat 整合语音模式

## 现状
- `/youjin-life/chat` 是纯文字聊天，调用 `youjin-life-chat` 边缘函数
- `/life-coach-voice` 是独立语音页面，使用 `CoachVoiceChat` 组件 + `vibrant-life-realtime-token` 端点
- 两者互相独立，用户无法在聊天页切换语音

## 方案：Header 增加语音通话按钮

在聊天页 Header 右侧添加一个「电话」图标按钮，点击后全屏展示 `CoachVoiceChat` 语音界面（覆盖在聊天页之上），关闭后回到文字聊天。

### 交互流程
1. 用户在 `/youjin-life/chat` 正常文字聊天
2. 点击 Header 右侧的电话图标 → 展示全屏语音模式（CoachVoiceChat 组件）
3. 语音结束/关闭 → 回到文字聊天界面
4. 需登录才能使用语音（未登录跳转 `/auth`）

### 修改文件

#### `src/pages/YoujinLifeChat.tsx`
- 新增 `showVoice` state（默认 false）
- 导入 `CoachVoiceChat`、`useAuth`、`getSavedVoiceType`、`Phone` 图标
- Header 右侧添加电话按钮：点击时检查登录状态，已登录 → `setShowVoice(true)`，未登录 → 跳转 auth
- 当 `showVoice === true` 时，渲染全屏 `CoachVoiceChat`：
  ```tsx
  <CoachVoiceChat
    onClose={() => setShowVoice(false)}
    coachEmoji="❤️"
    coachTitle="有劲AI生活教练"
    primaryColor="rose"
    tokenEndpoint="vibrant-life-realtime-token"
    userId={user.id}
    mode="general"
    featureKey="realtime_voice"
    voiceType={getSavedVoiceType()}
  />
  ```
- `showVoice` 为 true 时隐藏原有聊天 UI（CoachVoiceChat 已是全屏组件）

### 不变项
- 文字聊天功能、记账、服务链接等不变
- `/life-coach-voice` 独立页面保留不动
- 语音使用同样的 token 端点和计费逻辑

