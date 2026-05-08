# 修正：让管理员真正下载情绪健康测评的 PDF 报告

## 问题诊断

- 我上一版加的是「下载专属凭证 PNG」（其实是给用户加企微换 PDF 用的领取码图），不是 PDF 报告
- 真正的 PDF 导出能力只有「男人有劲」实现了：
  - `DynamicAssessmentPage` 支持 `?recordId=xxx&autoSave=pdf&adminPdf=1`
  - `DynamicAssessmentResult` 用 `exportNodeToPdf(reportCardRef)` 多页 A4 导出
- 情绪健康测评 (`EmotionHealthPage` + `EmotionHealthResult`) **当前根本没有 PDF 导出按钮**，所以管理员也没法触发

## 解决思路（对齐男人有劲）

### 1. `EmotionHealthResult.tsx` - 加上「保存为 PDF」能力
- 给整张报告 wrap 一个 `reportCardRef`（含三层诊断 + 维度卡 + AI 建议等已有内容）
- 新增 `autoSavePdf?: boolean` props：true 时自动触发 `exportNodeToPdf(reportCardRef.current, { filename: ... })`
- 保留现有的「领取专属 PDF（加企微）」CTA 不变，PDF 自动下载是叠加能力，不取代

### 2. `EmotionHealthPage.tsx` - 支持管理员模式加载任意记录
- 读 URL `recordId / autoSave / adminPdf / subjectName / subjectAvatar`
- 当 `recordId` 有值：直接 `select * from emotion_health_assessments where id = recordId`（admin RLS 已开启），把数据反序列化成 `EmotionHealthResultType`，跳过 start/questions 直接进 result step
- 把 `autoSavePdf` 透传给 `EmotionHealthResult`

### 3. `AssessmentRespondentDrawer.tsx` - 改按钮行为
- 把上一版的「下载专属凭证」改回「下载 PDF 报告」
- 点击 = 打开新窗口 `${origin}/emotion-health?recordId=${row.resultId}&autoSave=pdf&adminPdf=1&subjectUserId=${userId}&subjectName=...`
- 新窗口加载 → 自动渲染报告 → 自动下载 PDF
- 移除 EH 离屏 `EmotionHealthPdfClaimCard` 渲染（不再需要）
- 「复制发送话术」按钮保留

### 4. （可选小优化）
- 文件名：`情绪健康报告_{displayName}_{yyyy-mm-dd}.pdf`

## 不动

- 数据库 / RLS / 表结构（admin SELECT 已生效）
- 用户端原有「加企微换 PDF」流程 + 凭证图（仍然作为引流入口存在）
- `male_midlife_vitality` 现有逻辑

## 验证

1. 后台抽屉点「下载 PDF 报告」→ 新窗口 → 自动下载多页 A4 PDF
2. 普通用户访问 `/emotion-health` 流程不受影响
3. 管理员模式不写入新数据、不修改记录

## 技术细节

- 复用现成 `exportNodeToPdf(node, { filename, scale: 2 })`
- 管理员模式下隐藏「重新测试 / 分享 / 加企微」等会写状态的交互按钮，避免误触
- 加载失败给出 toast，不白屏
