

## Plan: 情绪检测按钮改为使用情绪教练

### 目标
点击宝妈AI页面的「😊 情绪检测」按钮后，打开一个类似当前宝妈AI聊天的 Sheet 界面，但：
- 标题改为「💜 情绪教练」
- 右上角按钮改为「📔 情绪日记」，链接到 `/history`（情绪教练的日记历史页）
- 底层使用 `emotion-coach` 边缘函数（即"劲老师"人设），而非 `mama-ai-coach`
- 对话会被记录到 `emotion_coaching_sessions`，可在情绪日记中查看

### 方案
最简洁的做法：让 MamaAIChat 组件支持「模式」切换，通过 props 控制标题、颜色、endpoint 和日记链接。

### 改动

**1. `src/components/mama/MamaAIChat.tsx`**
- 新增 props: `mode?: 'mama' | 'emotion'`
- 根据 mode 切换：
  - `mama` 模式（默认）：标题「💛 宝妈AI教练」，endpoint `mama-ai-coach`，右上角「📔 感恩记录」→ `/gratitude-journal`
  - `emotion` 模式：标题「💜 情绪教练」，endpoint `emotion-coach`，右上角「📔 情绪日记」→ `/history`，主色调改为紫色系
- 发送消息时，emotion 模式使用 `emotion-coach` 边缘函数的请求格式（需要传 `conversationId`）
- placeholder 相应调整

**2. `src/pages/MamaAssistant.tsx`**
- 「情绪检测」按钮改为打开 emotion 模式的 MamaAIChat：
  ```ts
  { emoji: "😊", title: "情绪检测", desc: "此刻还好吗", mode: "emotion" }
  ```
- 新增 state 跟踪当前 chatMode，传给 MamaAIChat

### 情绪教练对话格式适配
emotion-coach 边缘函数的请求格式与 mama-ai-coach 略有不同（需要 `conversationId`、返回包含 stage 信息等）。在 emotion 模式下，MamaAIChat 将：
- 调用 `emotion-coach` endpoint
- 传入 `conversationId`（首次对话时自动生成）
- 解析返回的 stage/briefing 信息（简化处理，不展示完整的阶段进度）
- 对话会自动存储到 `emotion_coaching_sessions`，在 `/history` 页面可查看

