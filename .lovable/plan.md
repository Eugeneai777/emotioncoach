## 继续完成剩余 3 项工作

前面已完成：DB 迁移、claim_code hooks、6 个 UI 组件、两个测评结果页 Hero/Sheet 集成、HandbookContainer 类型扩展。

剩余需要完成：

### 1. HandbookContainer Day 标题分流（小改）
在 `HandbookContainer.tsx` 的 `getDayTitle()` 中补 `women_competitiveness` 与 `midlife_awakening` 两个分支，从对应 config（`womenCompetitivenessHandbook.ts` / `midlifeAwakeningHandbook.ts`）取出每日主题标题。

### 2. AdminHandbookExport 数据构建（核心）
扩展 `src/pages/admin/AdminHandbookExport.tsx`：

- URL params 支持 `?type=women_competitiveness&id=xxx` 和 `?type=midlife_awakening&id=xxx`
- 新增 `buildWomenData(record)`：
  - 从 `competitiveness_assessments` 读取记录
  - 5 维（career / brand / resilience / finance / relationship）映射到 `dimensions`
  - 调用 `generate-handbook-insights` 拿 AI 文案；失败走 `womenCompetitivenessHandbook.ts` fallback
  - 7 天内容来自 config 的 `days[]`
- 新增 `buildMidlifeData(record)`：同上，6 维映射 + `midlifeAwakeningHandbook.ts`
- 输出 `HandbookData` 给 `HandbookContainer` 渲染 PDF

### 3. Edge Function 分流（AI prompt）
扩展 `supabase/functions/generate-handbook-insights/index.ts`：

- `type` 枚举增加 `women_competitiveness`、`midlife_awakening`
- 两套独立 system prompt：
  - **35+ 女性竞争力**：洞察"已有筹码 vs 自我贬低"，禁卷年轻、禁说教，语气温柔笃定，强调"把已有的资产摆出来"
  - **中场觉醒力**：洞察"内耗循环 vs 行动停滞"，禁鸡汤、禁口号，语气克制冷静，强调"把'再来一次'缩到 5 分钟可执行动作"
- 输入字段按各自维度 key 透传
- 同步在 `src/lib/reportAIInsight.ts` 增加两类 fallback 文案（与 config 中 7 天伴随手册基调一致）

### 4. 验证
- 跑 `bunx tsc --noEmit` 确保类型通过
- 手动验证两个测评结果页 `领取完整 7 天伴随手册` Sheet 弹出 + claim_code 渲染
- 管理后台手动访问导出 URL 验证 PDF 渲染（5 维 / 6 维 + 7 天内容）

### 涉及文件
- `src/components/admin/handbook/HandbookContainer.tsx`（getDayTitle 分流）
- `src/pages/admin/AdminHandbookExport.tsx`（buildWomenData + buildMidlifeData）
- `supabase/functions/generate-handbook-insights/index.ts`（prompt 分流）
- `src/lib/reportAIInsight.ts`（fallback 文案）

无 DB 变更、无新组件，只是把已铺设的管线打通。

确认后开工？