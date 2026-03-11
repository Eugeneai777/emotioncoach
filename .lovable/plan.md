

## 将「有劲陪长辈」重命名为「大劲AI」

用户选择了「大劲AI」作为长辈陪伴产品的品牌名，与小劲AI（青少年）、老哥AI（中年男性）形成家族系列。

### 需要修改的文件

| 文件 | 变更内容 |
|------|----------|
| `src/pages/ElderCarePage.tsx` | 标题、品牌区、分享文案、footer 中的"有劲陪长辈"全部替换为"大劲AI"，副标题改为"陪长辈，有大劲" |
| `src/pages/ElderChatPage.tsx` | 聊天页顶部标题改为"大劲AI" |
| `src/pages/ElderGreetingPage.tsx` | 若有品牌文字则同步更新 |
| `src/pages/ElderMoodPage.tsx` | 同上 |
| `src/pages/ElderRemindersPage.tsx` | 同上 |
| `supabase/functions/elder-chat/index.ts` | system prompt 中"有劲陪长辈"改为"大劲AI" |
| `src/components/energy-studio/AudienceHub.tsx` | label 从"老年关怀"改为"大劲AI" |
| `src/pages/ZhileProductsPage.tsx` | 若有相关文案则同步 |

### 品牌文案调整

- 品牌名：**大劲AI**
- 品牌 emoji：🌿（保留）
- 副标题：「陪长辈，有大劲」
- 中心按钮文字：保持「陪我聊聊」
- 按钮下方提示：「像有人在身边陪着你」
- Footer：「大劲AI · 让陪伴更简单」
- 分享标题：「大劲AI — 给爸妈一个更安心的陪伴入口」

路由路径 `/elder-care` 保持不变，避免破坏链接。

