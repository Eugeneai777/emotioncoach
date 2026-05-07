## 继续完成「男人有劲」领取码闭环

数据库 + 海报组件 + 领取 Sheet 已就绪。本步骤完成**用户端集成**和**管理后台**两块收尾。

### 一、用户端 `DynamicAssessmentResult.tsx`

仅对 `isMaleMidlifeVitality` 分支：

1. **移除** ¥3980「身份绽放训练营」卡片，仅保留 ¥399「7天有劲训练营」
2. **替换** 顶部「保存完整报告」按钮 → **「📩 加运营企微 · 免费领完整 PDF 报告」**
   - 点击打开 `<MaleVitalityPdfClaimSheet />`
   - 传入当前用户的 `claim_code`（通过 `useClaimCode(recordId)` 获取）
   - 女性版 `isWomenCompetitiveness` 保持原"保存完整报告"逻辑不变
3. **埋点**：`pdf_claim_sheet_opened` / `pdf_claim_code_copied` / `pdf_claim_card_saved`

### 二、新建 Hook `src/hooks/useClaimCode.ts`

```ts
useClaimCode(recordId) → { claimCode, loading }
```
- 从 `partner_assessment_results` 查 `claim_code`
- 若历史记录意外为 NULL，调用 RPC `generate_assessment_claim_code()` 补写

### 三、管理后台

#### `AssessmentRespondentDrawer.tsx`
- 新增搜索框：「按领取码搜索」（仅当 `template_id = male_midlife_vitality` 时显示）
- 表格新增 `claim_code` 列（等宽字体 + 复制按钮）
- 行操作新增两个按钮：
  - **「导出 PDF」**：复用 `MaleVitalityReportCard` + `html2canvas` + `jsPDF`，文件名 `有劲报告_{claim_code}_{nickname}.pdf`
  - **「复制话术」**：预置模板「您好，您的领取码是 {code}，附件为完整 PDF 报告...」

#### `AssessmentInsightsDetail.tsx`
- 同上：搜索框 + `claim_code` 展示列

### 四、技术实现要点

- PDF 导出用 `html2canvas` 将 `MaleVitalityReportCard` 渲染节点截图 → `jsPDF` A4 多页拼接
- 搜索逻辑：`.eq('claim_code', code.toUpperCase().replace(/\s/g, ''))`
- 领取码格式化展示：`M7K 9P2`（中间空格），复制时去空格

### 验证清单

- [ ] 老用户进入 `/assessment/male_midlife_vitality` 结果页能看到自己的 6 位领取码
- [ ] 女性版 `women_competitiveness` 完全不变
- [ ] 后台输入领取码可定位到该条记录
- [ ] 后台导出 PDF 内容与用户端一致

确认后开始实施。