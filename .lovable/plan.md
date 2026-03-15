

# 宝妈专区保留底部导航 + 设为默认首页

## 需求理解

1. 进入 `/mama`（宝妈专区）后保留 `AwakeningBottomNav` 底部导航
2. 底部导航可返回 `/mini-app`
3. 用户可将宝妈专区设为默认首页（下次访问 `/mini-app` 时直接显示宝妈专区）

## 方案

### 1. MamaAssistant 页面添加底部导航

**文件：`src/pages/MamaAssistant.tsx`**
- 引入并添加 `AwakeningBottomNav` 组件
- 移除或保留顶部 Home 按钮（已有底部导航可回首页）
- 底部增加 `pb-20` 避免内容被导航遮挡

### 2. 底部导航"我的"旁增加"首页"按钮（或复用现有按钮）

当前 `AwakeningBottomNav` 左侧是"我的"，右侧是"关于"。需要让用户能回到 `/mini-app`。

**方案**：中心按钮单击回到 `/mini-app` 首页（当菜单未打开时），或者将底部导航改为3个按钮布局：首页 | 中心sparkle | 我的。

考虑到简洁性，建议：
- 左侧改为 **首页**（Home 图标，指向 `/mini-app`）
- 右侧保留 **我的**（User 图标，指向 `/profile`）
- 移除"关于"按钮（或放入中心菜单）

### 3. 设为默认首页功能

**文件：`src/pages/MiniAppEntry.tsx`**
- 页面加载时检查 `localStorage.getItem('preferred_audience')`
- 若值为 `mama`，自动 `navigate('/mama', { replace: true })`

**文件：`src/pages/MamaAssistant.tsx`**（或用户设置页）
- 提供"设为我的首页"按钮，点击后 `localStorage.setItem('preferred_audience', 'mama')`

### 4. 底部导航调整详情

**文件：`src/components/awakening/AwakeningBottomNav.tsx`**
- 左侧：Home 图标 + "首页"，导航到 `/mini-app`（并清除 preferred_audience 的自动跳转，避免死循环——使用 `sessionStorage` 标记已跳转过）
- 右侧：User 图标 + "我的"，导航到 `/profile`
- "关于"移入中心弹出菜单

## 文件变更清单

| 文件 | 改动 |
|------|------|
| `AwakeningBottomNav.tsx` | 左侧改为首页(Home)，右侧改为我的(User)，关于移入菜单 |
| `MamaAssistant.tsx` | 添加 AwakeningBottomNav，添加"设为首页"按钮 |
| `MiniAppEntry.tsx` | 加载时检查 preferred_audience，自动跳转 |

