## 继续完成 35+女性竞争力 / 中场觉醒力 「7天伴随手册」

前面已完成：DB migration（claim_code + 触发器 + RPC）、`womenCompetitivenessHandbook.ts` / `midlifeAwakeningHandbook.ts` 配置、6 个新 UI 组件（Claim Card / PdfClaimCard / PdfClaimSheet）、2 个 claim code hooks。

剩余工作分 3 块：

### 1. 测评结果页接入（前端 UI 集成）

**`CompetitivenessResult.tsx` + `pages/WomenCompetitiveness.tsx`**
- `WomenCompetitiveness.tsx` 把 `assessmentId`（保存测评后拿到的 row.id）透传给 `<CompetitivenessResult>`
- `CompetitivenessResult.tsx`：
  - 新增 prop `assessmentId?: string`
  - 调用 `useCompetitivenessClaimCode(assessmentId)`
  - 在结果页核心区下方嵌入 `<CompetitivenessClaimReportCard>`（hero 卡片，含 claim_code）
  - 顶层挂 `<CompetitivenessPdfClaimSheet>`，由"领取完整 7 天伴随手册"按钮触发

**`MidlifeAwakeningResult.tsx` + `pages/MidlifeAwakeningPage.tsx`** 同样模式：
  - `useMidlifeAwakeningClaimCode(assessmentId)`
  - 嵌入 `<MidlifeAwakeningClaimReportCard>` + `<MidlifeAwakeningPdfClaimSheet>`

### 2. Admin PDF 导出扩展

**`src/components/admin/handbook/HandbookContainer.tsx`**
- `HandbookData.type` 扩展为 `"male_vitality" | "emotion_health" | "women_competitiveness" | "midlife_awakening"`
- 新增 `WOMEN_COMP_LABEL`（5 维：career/brand/resilience/finance/relationship）和 `MIDLIFE_LABEL`（6 维：internalFriction/selfWorth/actionStagnation/supportSystem/regretRisk/missionClarity）
- `labelMap` switch 增加 2 个新分支
- Day 标题文案分别给 women / midlife 4 个不同 title（Day1-2 / 3-4 / 5-6 / 7）

**`src/pages/admin/AdminHandbookExport.tsx`**
- `useParams` type 扩展支持 `"women" | "midlife"`
- `handbookType` 映射：`women → women_competitiveness`，`midlife → midlife_awakening`
- 新增 `buildWomenData(recordId)`：查 `competitiveness_assessments`（answers/dimension_scores/weakest_category），用 `WOMEN_CLUSTERS` / `WOMEN_FALLBACK_BY_SCORE` / `WOMEN_SEVEN_DAYS` / `WOMEN_CAMP_INVITE`，weakest = `weakest_category`
- 新增 `buildMidlifeData(recordId)`：查 `midlife_awakening_assessments`，用 `MIDLIFE_CLUSTERS` / `MIDLIFE_FALLBACK_BY_SCORE` / `MIDLIFE_SEVEN_DAYS` / `MIDLIFE_CAMP_INVITE`，weakest 取 dims 中最低分维度
- 顶部标题/文件名增加 2 种类型分支

### 3. 边缘函数 AI Prompt 扩展

**`supabase/functions/generate-handbook-insights/index.ts`**
- `type` 入参枚举增加 `"women_competitiveness"` 和 `"midlife_awakening"`
- 系统 prompt 分流：
  - **women_competitiveness**："对 35-55 已婚已育职场女性说话；不卷年轻、不催再厉害一点；把她已有的筹码（经验/人脉/情绪韧性/财务底气）摆到桌面上；语气稳、像同代姐妹"
  - **midlife_awakening**："对 35-55 男女中年人说话；不灌鸡汤、不喊'再战一次'；把'再来一次'缩到 5 分钟可执行动作；接住内耗、停滞、价值松动；语气务实、不煽情"
- `clusterInsights` 输出格式与旧版一致（`{ key: insight }`）
- 各 fallback 文本写入 `reportAIInsight.ts` 的 `FALLBACK_BY_TYPE`（增加 2 个 key）

### 技术细节

- 所有 SDK 写入仍遵循 `.select() + length === 0` 模式（claim code 已在 hook 中实现）
- PDF 导出沿用 `exportNodeToPdf`，无需改动
- Result 页 hero 卡使用 Tailwind 语义化 token，PDF 卡（750px）使用 inline style 兼容 html2canvas
- 路由：admin 入口新增 `/admin/handbook/women/:recordId` 和 `/admin/handbook/midlife/:recordId`（沿用现有 `:type` 参数即可）

### 涉及文件

修改：`CompetitivenessResult.tsx`、`MidlifeAwakeningResult.tsx`、`pages/WomenCompetitiveness.tsx`、`pages/MidlifeAwakeningPage.tsx`、`HandbookContainer.tsx`、`pages/admin/AdminHandbookExport.tsx`、`supabase/functions/generate-handbook-insights/index.ts`、`lib/reportAIInsight.ts`
