## 目标
修复管理后台点击【打开导出 PDF】时，跳转到的是当前登录管理员自己的测评页（而不是目标用户的报告）的 Bug。

## 根因
`DynamicAssessmentPage.tsx` 通过 `useDynamicAssessmentHistory(user.id)` 仅拉取当前登录用户自己的历史，再用 `historyRecords.find(r => r.id === urlRecordId)` 匹配。当管理员打开他人记录时 `find()` 必然失败，回落到管理员自己的 Intro/报告。

## 方案（仅 1 个文件改动）

在 `src/pages/DynamicAssessmentPage.tsx` 处理 `?recordId=...` 的 useEffect 中，新增「管理员直查」分支：

- 当 URL 同时带 `recordId` + `adminPdf=1` 且 `historyRecords.find()` 命中失败时：
  - 直接 `supabase.from('partner_assessment_results').select('*').eq('id', urlRecordId).maybeSingle()`
  - 成功 → `toast.message('管理员视图：正在查看他人报告')` + `handleViewHistoryRecord(data)`，触发既有的结果渲染与 `autoSave=pdf` 自动下载
  - 失败 / 无权限 → `toast.error('未找到该测评记录或无权访问')`

## 安全
- 数据库 RLS 已存在策略 `Admins full access to assessment results: has_role(auth.uid(),'admin')`，无需新增 migration。
- 非管理员伪造 `&adminPdf=1` 会被 RLS 直接拦截，返回空数据。

## 不受影响
- 普通用户答题、结果页、PDF 下载逻辑（纯前端 html2canvas + jspdf）
- 领取码 / Sticky bar / 女性报告 / 训练营 / 支付
- 管理后台 Drawer 按钮本身（URL 已带 `adminPdf=1`，无需改动）

## 涉及文件
- `src/pages/DynamicAssessmentPage.tsx`（唯一改动）
