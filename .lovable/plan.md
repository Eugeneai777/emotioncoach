

## Plan: 按入口区分日记类型 + 确保宝妈AI来源标识

### 改动

**1. `src/pages/MamaAssistant.tsx`**
- 给 `quickEntries` 加 `chatType` 字段：情绪检测 → `"emotion"`，感恩日记 → `"gratitude"`
- `openChat` 增加 `chatType` 参数，新增 `chatType` state 传给 `MamaAIChat`
- 主按钮"聊一聊"默认 `chatType="emotion"`

**2. `src/components/mama/MamaAIChat.tsx`**
- 新增 prop `chatType?: "emotion" | "gratitude"`（默认 `"emotion"`）
- 右上角按钮根据 `chatType` 动态切换：
  - `emotion` → "📝 情绪日记"，跳转 `/history`
  - `gratitude` → "📔 感恩日记"，跳转 `/gratitude-history`
- 关闭时调用 `save-mama-briefing` 传入 `chatType` 参数

**3. `supabase/functions/save-mama-briefing/index.ts`**
- 接收 `chatType` 参数
- `gratitude` 类型：title 前缀改为 `[宝妈AI-感恩]`，AI 提取 prompt 改为感恩主题
- `emotion` 类型：保持现有 `[宝妈AI]` 前缀

**4. `src/pages/History.tsx`**
- 已有 `mama_source` 检测和 "💛 宝妈AI" 徽章，无需改动（`[宝妈AI]` 前缀的情绪记录已正确显示）

**5. `src/pages/GratitudeHistory.tsx`**
- 类似 History.tsx，在加载感恩记录时检测 `[宝妈AI-感恩]` 前缀
- 显示 "💛 宝妈AI" 徽章标识来源

| 文件 | 改动 |
|------|------|
| `src/pages/MamaAssistant.tsx` | 传递 chatType |
| `src/components/mama/MamaAIChat.tsx` | 按 chatType 切换按钮和跳转路由 |
| `supabase/functions/save-mama-briefing/index.ts` | 按 chatType 区分保存前缀和 AI prompt |
| `src/pages/GratitudeHistory.tsx` | 感恩记录显示宝妈AI来源徽章 |

