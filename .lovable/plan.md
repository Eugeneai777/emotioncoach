## 用户反馈
1. 管理员后台「打开导出 PDF」需要先打开新页签，再手动点 PDF 按钮，太繁琐。
2. 当前打开后高亮提示了「点这里保存 PDF ↓」，但用户实际没成功下载。

## 根因
`DynamicAssessmentResult.tsx:328` 的 `autoSavePdf=true` 只做了「滚动 + 高亮 + toast 提示」，**没有真正自动触发** `handleSaveAsPdf()`。所以仍需用户手动点击。

## 方案：一键直接下载（推荐）

保留新页签机制（PDF 生成必须在结果页 DOM 上下文里跑 html2canvas），但让其**自动完成**整个下载，无需任何手动操作。

### 1. `src/components/dynamic-assessment/DynamicAssessmentResult.tsx`
- 改造 `autoSavePdf` useEffect：
  - 等待 ~1.8s 让报告卡片 DOM + 图标 / 字体渲染完成
  - 直接 `await handleSaveAsPdf()` 自动触发下载
  - 成功 toast：「PDF 已自动下载，可关闭此页面」
  - 失败 toast 保留「请手动点击保存按钮」作为兜底
- 管理员场景一定不在微信内，但保险起见：当 `autoSavePdf=true` 时，跳过 `isWeChatLike` 引导分支，强制走 `exportNodeToPdf`。

### 2. `src/components/admin/AssessmentRespondentDrawer.tsx`
- 按钮文案改为「下载 PDF 报告」，更符合预期。
- 仍用 `window.open(url, '_blank')` 打开新页签（保持当前安全/RLS 路径）。

## 不改动
- `?recordId=...&adminPdf=1` URL 协议、admin RLS 直查逻辑（已实现并通过）
- 普通用户（无 `autoSave=pdf` 参数）的手动下载流程
- 微信内引导（`isWeChatLike` 普通分支）

## 用户视角
后台点击 → 新窗口打开 → 自动滚动到报告 → 自动下载 PDF → 提示「已下载，可关闭」。无需任何二次点击。

## 涉及文件
- `src/components/dynamic-assessment/DynamicAssessmentResult.tsx`
- `src/components/admin/AssessmentRespondentDrawer.tsx`（仅文案）
