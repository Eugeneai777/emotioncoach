

## Plan: 感恩日记按钮链接到感恩教练

### 现状
- MamaAssistant 页面的「📝 感恩日记」按钮目前打开 AI 聊天（context: "我想记录一件今天让我感恩的小事..."）
- 感恩教练入口页：`/gratitude-journal-intro`
- 感恩日记历史页：`/gratitude-journal`（即 GratitudeHistory）
- AssessmentTools 页面的感恩日记链接到 `/gratitude`（可能无效）

### 改动

1. **MamaAssistant.tsx** — 将「感恩日记」快捷入口改为路由跳转到 `/gratitude-journal-intro`（感恩教练入口页），而非打开聊天
   ```ts
   { emoji: "📝", title: "感恩日记", desc: "记录美好", route: "/gratitude-journal-intro" }
   ```

2. **AssessmentTools.tsx** — 修正感恩日记工具的路由从 `/gratitude` 改为 `/gratitude-journal-intro`，确保一致性

3. **MamaDailyEnergy.tsx** — 感恩提交成功后的 toast 增加「查看全部」按钮，点击跳转到 `/gratitude-journal`（历史记录页）

这样用户从宝妈AI进入感恩教练完整流程，记录的内容统一存储在 `gratitude_entries` 表中，在感恩教练的历史页面可查看。

