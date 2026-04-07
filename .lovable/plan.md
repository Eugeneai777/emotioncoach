

# 修复三个问题

## 问题总结

1. **场景卡缺乏引导提示**：用户不知道可以点击进入对话，需要添加明显的视觉引导
2. **多测评推荐只显示一个**：`ChatBubble.tsx` 用 `.match()` 只匹配第一个 `[ASSESSMENT]` 标记，职场场景的双测评推荐只渲染一个
3. **7天有劲训练营推荐无跳转卡片**：当所有测评已完成时，AI 推荐训练营只是纯文本，没有可点击的卡片和路由

## 改动

### 1. `src/pages/MiniAppEntry.tsx` — 场景卡添加引导

每张场景卡右侧添加"聊一聊 →"文字提示和 `ChevronRight` 图标，让用户明确知道可以点击进入对话。添加 hover/active 状态增强交互感。

### 2. `src/components/youjin-life/ChatBubble.tsx` — 支持多个测评卡片

将 `assessmentMatch`（`.match()` 只返回第一个）改为 `matchAll` 循环，解析所有 `[ASSESSMENT]...[/ASSESSMENT]` 标记，每个渲染为独立卡片。

同时新增 `[CAMP]...[/CAMP]` 标记解析，渲染为训练营推荐卡片（区别于测评卡片的配色）。

### 3. `supabase/functions/youjin-life-chat/index.ts` — 训练营推荐加路由标记

当所有测评已完成时，AI prompt 中输出 `[CAMP]{"title":"7天有劲训练营","route":"/camps","desc":"AI+真人陪伴·系统蜕变","price":"¥399"}[/CAMP]` 标记，前端自动渲染为可点击的训练营卡片。

同样在其他 topic（anxiety/relationship/wealth）的"已完成"分支也加上 `[CAMP]` 标记。

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/pages/MiniAppEntry.tsx` | 场景卡添加"聊一聊 →"引导文字和交互反馈 |
| `src/components/youjin-life/ChatBubble.tsx` | matchAll 支持多测评卡片；新增 [CAMP] 训练营卡片解析 |
| `supabase/functions/youjin-life-chat/index.ts` | 已完成测评时输出 [CAMP] 标记含路由 |

