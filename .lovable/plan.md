

## Plan: 宝妈AI对话结束时推荐课程中心视频

### 思路

在对话进行到一定轮数后（≥4条消息），调用现有的 `recommend-courses` Edge Function，基于对话内容匹配课程中心的视频，在聊天底部展示推荐卡片。

### 改动

| 文件 | 内容 |
|------|------|
| `src/components/mama/MamaAIChat.tsx` | 对话 ≥4 条消息时，调用 `recommend-courses` 获取推荐视频，在 `MamaConversionCard` 下方展示视频推荐卡片 |
| `src/components/mama/MamaCourseRecommendation.tsx` | **新建**：宝妈AI专用的课程推荐组件，展示1-2个匹配视频，点击跳转观看 |

### 具体逻辑

**1. `MamaAIChat.tsx`**
- 新增 state: `courseRecommendations`
- 当最后一条 assistant 消息流式完成 + 消息数 ≥4 时，调用 `recommend-courses`：
  ```typescript
  supabase.functions.invoke('recommend-courses', {
    body: {
      briefing: {
        emotion_theme: messages.map(m => m.content).join(' '),
        tags: [chatType === 'gratitude' ? '感恩' : '情绪管理']
      },
      coachType: 'mama'
    }
  })
  ```
- 将返回的 recommendations 存入 state，在聊天消息流末尾渲染 `MamaCourseRecommendation`

**2. `MamaCourseRecommendation.tsx`（新建）**
- 接收 recommendations 数组，展示前2个推荐
- 每个卡片显示：标题、匹配度、推荐理由
- 点击"观看课程"→ 跳转 `/courses` 或直接打开视频 URL
- 风格与现有 MamaConversionCard 一致（暖色调、圆角卡片）
- 包含"查看更多课程"按钮跳转 `/courses`

```text
┌──────────────────────────────────┐
│ 🎬 为你推荐相关课程               │
│                                  │
│ ┌────────────┐ ┌────────────┐   │
│ │ 匹配92%    │ │ 匹配85%    │   │
│ │ 课程标题   │ │ 课程标题   │   │
│ │ 推荐理由   │ │ 推荐理由   │   │
│ │ [观看课程] │ │ [观看课程] │   │
│ └────────────┘ └────────────┘   │
│        [查看更多课程 →]          │
└──────────────────────────────────┘
```

### 要点
- 推荐请求在后台执行，不阻塞聊天
- 仅在有推荐结果时显示卡片
- 复用现有 `recommend-courses` 函数，无需新建后端接口

