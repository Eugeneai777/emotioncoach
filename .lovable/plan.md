

# 修复 Logo 点击导航到用户指定首页

## 问题分析

当前存在两个问题：

1. **`PageHeader` 组件硬编码导航到 `/`**：Logo 点击始终跳转到 `/`，没有读取用户在数据库中配置的 `home_page_path`（如 `/coach-space`、`/coach/wealth_coach_4_questions`）
2. **`CompetitivenessStartScreen` 没有使用 `PageHeader`**：仍然用自定义 header，Logo 点击调用 `onBack`（即 `navigate(-1)`），如果没有浏览历史则无反应

## 解决方案

### 1. 修改 `PageHeader` — 支持用户指定首页

从 `useQuickMenuConfig` 钩子或直接查询数据库读取用户的 `home_page_path`，Logo 点击导航到该路径而非固定的 `/`。

- 引入 `useQuickMenuConfig` 或单独查询 `home_page_path`
- 将 `navigate('/')` 改为 `navigate(userHomePath || '/')`

### 2. 修改 `CompetitivenessStartScreen` — 使用 `PageHeader`

替换自定义 header 为统一的 `PageHeader` 组件，保留右侧"历史记录"按钮。

### 3. 确保 `useQuickMenuConfig` 暴露 `home_page_path`

当前钩子没有读取 `home_page_path` 字段。需要在加载配置时一并读取并暴露出来。

## 技术改动

| 文件 | 改动 |
|------|------|
| `src/hooks/useQuickMenuConfig.ts` | 从数据库读取 `home_page_path`，在返回值中暴露 `homePage` 字段 |
| `src/components/PageHeader.tsx` | 引入 `useQuickMenuConfig`，Logo 点击改为导航到 `homePage` 而非 `/` |
| `src/components/women-competitiveness/CompetitivenessStartScreen.tsx` | 替换自定义 header 为 `PageHeader`，将"历史记录"按钮放在 `rightActions` |

