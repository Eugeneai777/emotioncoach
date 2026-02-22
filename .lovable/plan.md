

## 修复 Logo 点击跳转不一致问题

### 问题

| 组件 | 当前行为 | 问题 |
|------|----------|------|
| PageHeader (40+ 页面使用) | 跳转到 `homePage`（用户配置值，可能是 `/coach-space`） | 绕过了 SmartHomeRedirect 的智能路由 |
| CoachHeader (教练对话页) | 硬编码跳转到 `/` | 正确，经过 SmartHomeRedirect |
| Courses.tsx | 硬编码跳转到 `/` | 正确 |
| PartnerTypeSelector.tsx | 硬编码跳转到 `/` | 正确 |

核心矛盾：`PageHeader` 使用 `useQuickMenuConfig().homePage` 获取跳转路径，如果用户的 `home_page_path` 设置为 `/coach-space`，Logo 点击后直接去教练空间列表页，绕过了 SmartHomeRedirect 对财富用户的智能路由（应跳转到 `/coach/wealth_coach_4_questions`）。

### 方案

将 `PageHeader` 的 Logo 点击统一改为跳转到 `/`，让 SmartHomeRedirect 根据用户类型智能路由。`homePage` 配置仅用于浮动快捷菜单的首页按钮，不影响 Logo 行为。

### 改动

#### 1. PageHeader.tsx

- Logo 点击从 `navigate(homePage)` 改为 `navigate('/')`
- `isHomePage` 判断从 `location.pathname === '/' || location.pathname === homePage` 改为 `location.pathname === '/'`
- 移除对 `useQuickMenuConfig` 的依赖（如果无其他用途）

#### 2. PartnerTypeSelector.tsx (已正确，无需改动)

#### 3. Courses.tsx (已正确，无需改动)

#### 4. CoachHeader.tsx (已正确，无需改动)

### 改动文件

| 文件 | 改动 |
|------|------|
| `src/components/PageHeader.tsx` | Logo 跳转改为 `/`，移除 `useQuickMenuConfig` 导入 |

### 影响范围

使用 `PageHeader` 的 40+ 页面的 Logo 行为将统一为：点击跳转到 `/`，由 SmartHomeRedirect 智能分发到对应教练页面。

