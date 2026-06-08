## 问题定位

用户在微信中通过分享链接（`ref=share`，未登录）进入 `/wealth-block`。该页内有按钮会 `navigate("/coach/wealth_coach_4_questions")`（`WealthBlockAssessment.tsx:1080`）。当浏览历史中存在 `/coach/wealth_coach_4_questions`（或从首页等场景预先进入过），点击 WebView 的回退会回到 DynamicCoach 页。

`DynamicCoach` 通过 `useCoachTemplate` 查询 `coach_templates`：
- 现有 RLS 策略 `Authenticated can view active coach templates` 只允许 `authenticated` 角色读取
- 匿名用户查询返回空 → `template` 为 `null` → 渲染 `教练配置加载失败`（`DynamicCoach.tsx:213-219`）

WeChat WebView 仍显示上一个页面的 `document.title`（"财富卡点测评 - 有劲AI"），所以视觉上"像还在测评页"，但实际路由已切到 coach 页。

这与项目"开放浏览"策略（mem: Unauthenticated Visibility Standard）一致：教练模板属于公开可浏览的配置型数据，应允许匿名只读访问 active 行。

## 修改方案

### 1. 数据库迁移：放开 `coach_templates` 的匿名只读

新增 migration：
- 新增 RLS 策略：`Anon can view active coach templates`，仅 `SELECT`，条件 `is_active = true`
- `GRANT SELECT ON public.coach_templates TO anon`

不动现有 authenticated / partner / admin 策略，业务逻辑零变更。

### 2. 前端兜底：DynamicCoach 加载失败时给出可用出口（可选小改）

`src/pages/DynamicCoach.tsx` 第 213-219 行的错误态目前是死页面。增加一个返回按钮（`navigate(-1)` 失败时回到 `/`），避免用户卡死。仅 UI 兜底，不改业务逻辑。

## 不改动

- 不动 DynamicCoach 的加载/对话逻辑
- 不动 `WealthBlockAssessment` 的导航行为
- 不动语音/情绪教练的现有配置
