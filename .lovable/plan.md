

## 问题分析

这三个页面（`/story-coach`、`/human-coaches`、`/team-coaching`）使用的是 `PageHeader` 组件，而不是 `CoachHeader`。之前的主页按钮只加在了 `CoachHeader` 中，所以这三个页面没有覆盖到。

`PageHeader` 已有 `showHomeButton` 属性，但它只渲染一个图标按钮跳转到 `/`，且没有设置 `skip_preferred_redirect`，行为不一致。

## 修改方案

### 方案一（推荐）：在三个页面的 `PageHeader` 调用处传入 `showHomeButton`，并改进 `PageHeader` 中 home 按钮的行为

**文件 1**: `src/components/PageHeader.tsx`
- 修改 `showHomeButton` 对应的按钮：跳转目标改为 `/mini-app`，点击时设置 `sessionStorage.setItem('skip_preferred_redirect', '1')`，与 `CoachHeader` 保持一致
- 样式改为带"主页"文字的小按钮（与 CoachHeader 一致）

**文件 2**: `src/pages/StoryCoach.tsx`（第 165 行）
- `<PageHeader>` 添加 `showHomeButton`

**文件 3**: `src/pages/HumanCoaches.tsx`（第 50 行）
- `<PageHeader>` 添加 `showHomeButton`

**文件 4**: `src/pages/TeamCoaching.tsx`（第 20 行）
- `<PageHeader>` 添加 `showHomeButton`

### 不影响现有逻辑
- 仅在这三个页面启用已有的 `showHomeButton` 属性
- `PageHeader` 的 home 按钮行为改进对其他已使用 `showHomeButton` 的页面也适用（统一体验）
- 不修改任何业务逻辑或数据流

