

## 需求分析

所有教练页面（情绪教练、财富教练、亲子教练、沟通教练等）都通过 `CoachLayout` → `CoachHeader` 组件渲染头部。只需在 `CoachHeader` 中增加一个"主页"按钮即可覆盖所有教练页面。

## 实施方案

**修改文件**: `src/components/coach/CoachHeader.tsx`

在 Logo 左侧（或 Logo 和汉堡菜单之间）增加一个"主页"按钮，样式与 `/mama` 页面一致：

- 点击跳转 `/mini-app`
- 点击时设置 `sessionStorage.setItem('skip_preferred_redirect', '1')` 防止自动重定向
- 使用 `Home` 图标 + "主页" 文字，样式为小字灰色

具体位置：在 Logo 之前添加，与受众页面（mama、workplace 等）保持一致的左上角位置。

## 影响范围

- **自动覆盖的页面**（均使用 CoachLayout/CoachHeader）：
  - `/emotion-coach`（情绪教练 - Index.tsx）
  - `/coach/wealth_coach_4_questions`（财富教练）
  - `/parent-emotion`（亲子教练）
  - `/communication-coach`（沟通教练）
  - `/dynamic-coach`（动态教练）
  - 所有其他通过 CoachLayout 渲染的教练页面

- **不影响现有逻辑**：仅在 header 左侧新增一个导航按钮，不修改任何业务逻辑、聊天流程或数据处理

