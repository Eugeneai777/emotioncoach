

## Plan: 宝妈AI对话记录到情绪日记

### 改动概要

1. **替换右上角按钮**：把"📔 感恩记录"改为"📝 情绪日记"，跳转 `/history`
2. **关闭聊天时自动保存**：对话 ≥2 条消息时，调用 Edge Function 提取情绪摘要并写入 `conversations` + `briefings` 表
3. **情绪日记页标注来源**：History 页面识别 `[宝妈AI]` 前缀，显示"💛 宝妈AI"徽章

### 具体改动

| 文件 | 内容 |
|------|------|
| `src/components/mama/MamaAIChat.tsx` | 按钮改为"📝 情绪日记"→`/history`；关闭时触发保存逻辑 |
| `supabase/functions/save-mama-briefing/index.ts` | 新建 Edge Function：用 AI 从对话提取 emotion_theme/intensity/insight/action，写入 conversations（title 前缀 `[宝妈AI]`）和 briefings |
| `src/pages/History.tsx` | 检测 title 以 `[宝妈AI]` 开头时显示来源徽章 |

### Edge Function 逻辑

```text
输入: { messages, userId }
  ↓
AI 提取: emotion_theme, intensity(1-5), insight, action
  ↓
INSERT conversations (user_id, title="[宝妈AI] {theme}")
  ↓
INSERT briefings (conversation_id, emotion_theme, emotion_intensity, insight, action)
  ↓
返回 { success: true }
```

- 使用 `google/gemini-2.5-flash`，无需额外 API key
- 保存在后台静默执行，不阻塞用户
- 未登录用户静默跳过

