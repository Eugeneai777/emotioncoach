## 目标

- 移除【男人有劲状态评估】+【中年觉醒测评】结果页所有 PDF 领取功能与文案。
- 保留加微转化入口,改为「1V1 顾问解读 · 拆解认知盲区 · 拿专属行动方案」轻量话术。
- 同步移除管理后台对这两个测评的「领取码」相关功能。
- 【情绪健康测评】+【35+ 女性竞争力测评】完全不动。

## 商业评估

- 中年男性对「完整 PDF 报告」感知偏重,反而抑制扫码加微动机。改为「拆解盲区 · 拿行动方案」更轻、更勾人。
- 加微漏斗保留,顾问后台改用普通用户列表 + 测评摘要识别用户(无需领取码核销),减少一道操作。
- 情绪健康 / 女性竞争力测评的 PDF 领取转化此前数据正常,**不动**。

## 改动范围(纯前端)

### 1. 男人有劲(`male_midlife_vitality`)结果页

文件:`src/components/dynamic-assessment/DynamicAssessmentResult.tsx`

- **L1174-1192 主 CTA**:
  - 文案:`📋 领取我的完整诊断报告(PDF)` → `🎯 拆解你的认知盲区,拿专属行动方案`
  - 副文案:`由 有劲顾问 亲自发送  · 1v1 解读建议` → `1V1 顾问解读 · 帮你拿到本周可执行的下一步`
  - 行为:仍打开 `MaleVitalityPdfClaimSheet`(改名后即「加微解读弹窗」)。
- **L747-776 未登录态 Lite 卡**:
  - 标题:`登录解锁完整报告 + 私密 PDF` → `登录解锁 6 维深度诊断 + AI 私人解读`
  - 副文案:`6 维深度诊断 · AI 私人解读 · 一键保存私密 PDF` → `6 维深度诊断 · AI 私人解读 · 关键认知盲区拆解`
- *L85- `autoSavePdf` & 保存格式 Sheet**:男版禁用 PDF 路径(`?autoSave=pdf` 仅对女性竞争力生效);保存 Sheet 仅 `isWomenCompetitiveness` 触达,男版无入口。
- **L315 toast**「网络较慢,可截屏保存或改存 PDF」:男版触达分支改为「网络较慢,可截屏保存」。

文件:`src/components/dynamic-assessment/MaleVitalityClaimStickyBar.tsx`

- 按钮文案:`📋 领取我的完整诊断报告(PDF)` → `🎯 拆解认知盲区 · 拿专属行动方案`
- 副文案:`由 有劲顾问 亲自发送 · 24 小时内送达 · 1v1 解读建议` → `1V1 顾问解读 · 帮你拿到下一步行动`

文件:`src/components/dynamic-assessment/MaleVitalityPdfClaimSheet.tsx`

- 不重命名文件(避免 import 大改),仅替换内部全部「PDF / 完整诊断报告 / 24 小时内送达 / 手册」字样。
- 主标题示例:`领取你的 1V1 顾问解读`;副文案:`凭此码加顾问企微,预约一次解读 + 拿专属行动方案`。
- 视觉:去掉 PDF 图标暗示,保留头像 + 领取码 + 二维码。

### 2. 中年觉醒(`midlife_awakening`)结果页

文件:`src/components/midlife-awakening/MidlifeAwakeningClaimReportCard.tsx`

- L160 `份专属 PDF` → `次 1V1 顾问解读`(或删除该统计格)。
- L225 `凭此码加顾问企微,免费领取你的「7 天伴随手册」PDF` → `凭此码加顾问企微,预约一次 1V1 解读 + 拿专属行动方案`。
- 顶部 hero 主行动文案 / 副文案统一去掉 `PDF / 手册 / 报告`,改为「拆解你的中场盲区 · 拿一份行动地图」(stamina 计算不动)。

文件:`src/components/midlife-awakening/MidlifeAwakeningPdfClaimSheet.tsx`

- 不重命名;内部所有 PDF / 手册字样替换为 1V1 顾问解读话术,与男版统一调性。

### 3. 管理后台移除「领取码」相关功能

文件:`src/components/admin/AssessmentInsightsDetail.tsx`

- 当 `template.assessmentKey === "male_midlife_vitality"` 时,不显示领取码列 / CSV 不导出 `claimCode` 列。
- 搜索逻辑保留(避免破坏其他测评),但移除男版 `claimCode` 命中分支。
- `isMaleVitality` 相关领取码 UI 全部删除。
- 情绪健康 / 女性竞争力测评的领取码列表逻辑保持不变。

文件:`src/components/admin/AssessmentRespondentDrawer.tsx`

- L84-97:删除 `template?.assessmentKey === "male_midlife_vitality"` 的领取码复制按钮分支(保留 `isEmotionHealth` 分支)。
- L98-123:删除男版「复制 PDF 发送话术」按钮。
- L125-* 情绪健康分支保留不动。

文件:`src/hooks/useMidlifeAwakeningClaimCode.ts`

- 前端不再展示领取码 → hook 调用方移除(`MidlifeAwakeningResult.tsx` 中 `useMidlifeAwakeningClaimCode` 调用 + `claimCode` / `loadingCode` 透传删除)。
- hook 文件本身保留(可能被其他页面/邮件链路引用,留作未来回滚)。

### 4. 不动项

- `useClaimCode` / `useMidlifeAwakeningClaimCode` 后端 edge function、生成逻辑、数据库表:**全部保留**(便于回滚 + 顾问端历史码核销)。
- 情绪健康(`emotion_health`)+ 35+ 女性竞争力(`women_competitiveness`)的结果页、PDF 流程、后台领取码 UI:**完全不动**。
- `WeChatPdfGuideSheet`(女力测评仍用)、`AdminHandbookExport`(后台仍可手工导出 PDF 发企微):保留。
- 埋点事件名(`pdf_claim_sheet_opened` / `pdf_claim_sticky_clicked` / `pdf_claim_sticky_view`)保留,只换 UI 文案,避免历史漏斗断裂;后续平台侧可重命名展示。

## 验证

1. `/assessment/male_midlife_vitality` 完成测评 → 顶部 hero、主 CTA、Sticky 底栏、加微弹窗均无「PDF / 完整诊断报告 / 手册」字样;加微弹窗仍可正常显示头像 + 二维码。
2. `/midlife-awakening` 完成测评 → 同上;顶部续航卡仍展示但话术轻量化。
3. 管理后台 → 男人有劲测评受访者抽屉:领取码与 PDF 话术按钮消失;情绪健康抽屉领取码仍在。
4. 管理后台 → 男人有劲洞察导出 CSV:不含 claimCode 列;情绪健康 / 女力导出不变。
5. `/assessment/women_competitiveness` + `/assessment/emotion_health` 端到端不受影响。