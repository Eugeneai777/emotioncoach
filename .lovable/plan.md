## 总览

数据库迁移 + 配置文件 + 中场领取码 hook 已完成。本次完成：前端 UI 接入 + Admin PDF 导出 + AI 心声 prompt。

两个测评对标关系：
- **35+ 女性竞争力测评** → 对标 **情绪健康测评**（玫瑰金 / 「她」叙事，基于 weakest_category 5 套脚本）
- **中场觉醒力测评** → 对标 **男人有劲状态评估**（深色商务感 / 中年同代叙事，基于 weakest dimension 6 套脚本）

每个测评新增：`PdfClaimCard`（顶部 Hero）+ `PdfClaimSheet`（截图凭证海报）+ `ClaimStickyBar`（底部吸底）+ `useClaimCode` hook + Admin PDF 导出路由。

---

## 1. 中场领取码 hook（缺失）

新建 `src/hooks/useMidlifeAwakeningClaimCode.ts`：照搬 `useCompetitivenessClaimCode` 结构，表名换成 `midlife_awakening_assessments`，RPC 换成 `generate_midlife_awakening_claim_code`。

## 2. 35+ 女性竞争力 UI（对标情绪健康，玫瑰金/「她」叙事）

新建 3 个文件 + 改 1 个文件：

- `src/components/women-competitiveness/CompetitivenessClaimReportCard.tsx` —— 顶部 Hero 卡，渐变同 EmotionHealthClaimReportCard，文案按「筹码」叙事：
  - 顶部：「35+ 的你 · 专属竞争力画像」
  - 中部「筹码电量」= 综合分（按 5 维加权：career×0.25 + brand×0.2 + resilience×0.2 + finance×0.2 + relationship×0.15）
  - 副文案分档：满格 / 续航中 / 需要重新出牌
  - 底部领取码按钮 → 打开 Sheet
- `src/components/women-competitiveness/CompetitivenessPdfClaimCard.tsx` —— 750px 离屏渲染海报，结构同 `EmotionHealthPdfClaimCard`：5 个维度小格子 + 弱项标签（最弱的 1 个 category 的中文 label）+ 领取码 + QiWei 二维码。
- `src/components/women-competitiveness/CompetitivenessPdfClaimSheet.tsx` —— Bottom Sheet，3 步引导 + 海报预览 + 复制码/保存图片，照搬 EmotionHealth 版。
- 改 `CompetitivenessResult.tsx`：
  - 接收新 prop `assessmentId?: string | null`
  - 顶部插入 `<CompetitivenessClaimReportCard onClickClaim={() => setOpen(true)} />`
  - 末尾挂载 `<CompetitivenessPdfClaimSheet open ... />`
  - 调用 `useCompetitivenessClaimCode(assessmentId)`
- 改 `src/pages/WomenCompetitiveness.tsx`：把测评写库后的 `id` 透传给 `<CompetitivenessResult assessmentId=... />`

## 3. 中场觉醒力 UI（对标男人有劲，深色商务/中年男性向）

新建 3 个文件 + 改 1 个文件：

- `src/components/midlife-awakening/MidlifeAwakeningClaimReportCard.tsx` —— Hero，渐变 `slate-900 → indigo-900 → zinc-900`，金色强调色，文案：
  - 顶部「中场 · 私密评估报告」
  - 中部「行动续航」分（基于 6 维加权，弱项越多分越低）
  - 分档：充足 / 待启动 / 需要外力托一把
- `src/components/midlife-awakening/MidlifeAwakeningPdfClaimCard.tsx` —— 750px 海报，6 维度小格 + 最弱维度中文 label + 领取码 + QiWei 二维码。深色基调 + 金色领取码。
- `src/components/midlife-awakening/MidlifeAwakeningPdfClaimSheet.tsx` —— Bottom Sheet，3 步引导 + 预览 + 复制/保存。
- 改 `MidlifeAwakeningResult.tsx`：接收 `assessmentId`，顶部 Hero + 末尾 Sheet，调用 `useMidlifeAwakeningClaimCode`。
- 改对应 page（`MidlifeAwakening.tsx`）把测评 id 透传。

## 4. Admin PDF 导出扩展

改 `src/components/admin/handbook/HandbookContainer.tsx`：
- `HandbookData.type` 扩展为 `"male_vitality" | "emotion_health" | "women_competitiveness" | "midlife_awakening"`
- P1 / P2 标题、P6-P9 day 标题文案分支：
  - women_competitiveness：「Day 1-2 · 把盘面摆出来」「Day 3-4 · 把'应该'放下一格」「Day 5-6 · 让一个人看见你」「Day 7 · 35+ 的我，最值钱的是…」
  - midlife_awakening：「Day 1-2 · 先承认卡住」「Day 3-4 · 把'再来一次'缩到 5 分钟」「Day 5-6 · 找回意义半径」「Day 7 · 我的中场宣言」
- `MALE_LABEL` / `FEMALE_PATTERN_LABEL` 旁边新增 `WOMEN_COMP_LABEL`（career/brand/resilience/finance/relationship → 中文）和 `MIDLIFE_LABEL`（来自 `MIDLIFE_DIM_LABEL`）

改 `src/pages/admin/AdminHandbookExport.tsx`：
- 路由 type 扩展：`"male" | "emotion" | "women" | "midlife"`
- `HandbookType` 扩展（同时改 `src/lib/reportAIInsight.ts` 的类型）
- 新增 `buildWomenData(recordId)`：读 `competitiveness_assessments`，按 5 维 + `WOMEN_CLUSTERS` 重组，用 `WOMEN_FALLBACK_BY_SCORE` + `WOMEN_SEVEN_DAYS[weakest]` + `WOMEN_CAMP_INVITE`
- 新增 `buildMidlifeData(recordId)`：读 `midlife_awakening_assessments`，按 6 维 + `MIDLIFE_CLUSTERS` 重组，用 `MIDLIFE_FALLBACK_BY_SCORE` + `MIDLIFE_SEVEN_DAYS[weakest]` + `MIDLIFE_CAMP_INVITE`
- 顶部标题分支 + 文件名前缀（"她的中场"、"中场觉醒"）

## 5. AI 心声 edge function 扩展

改 `supabase/functions/generate-handbook-insights/index.ts`：
- `type` 入参枚举增加 `women_competitiveness` / `midlife_awakening`
- 新增 2 个 system prompt：
  - women_competitiveness：35+ 女性同代姐姐口吻，强调「不卷年轻、把已有筹码摆出来」，禁用「加油 / 你可以的 / 努力」类口号
  - midlife_awakening：35-55 中年同代男性口吻，强调「不灌鸡汤、把'再来一次'缩到 5 分钟」，禁用「重启人生 / 逆袭」类大词
- 输出结构不变（coverNote / clusterInsights / day7Reflection / fullReading）

## 6. 关键技术细节

- **领取码持久化**：所有 4 个测评统一遵循「触发器自动生成 → hook 兜底 RPC 补写 → `.select()` + 长度校验」的标准（已建立的 SDK CRUD Hardening 规范）
- **Admin 路由**：`/admin/handbook/:type/:recordId` 扩展支持 `women` / `midlife`，需要在 `App.tsx` 路由表里确认现有路由就支持新 type（如果用 wildcard 则无需改）
- **配色 token**：所有渐变色使用 inline style（html2canvas 兼容），不要走 tailwind semantic token；UI 卡片按现有 EmotionHealth/Male 版风格保持
- **不改业务逻辑**：测评算法、问题数、写库流程完全不动，只在结果页前端增加领取闭环

## 7. 验收

- 35+ 女性测评完成 → 结果页顶部出现玫瑰金「专属领取码」Hero → 点击弹 Sheet → 截图保存 → 7 天伴随手册按 weakest_category 个性化
- 中场觉醒测评完成 → 结果页顶部出现深色金色「中场行动续航」Hero → 点击弹 Sheet → 7 天脚本按 weakest dimension 个性化
- Admin 路由 `/admin/handbook/women/<recordId>` 与 `/admin/handbook/midlife/<recordId>` 可生成 11 页 A4 PDF