

## 交换底部导航栏「介绍」和「我的」位置

将左侧「我的」改为「介绍」，右侧「介绍」改为「我的」。

### 修改文件
`src/components/awakening/AwakeningBottomNav.tsx`

- **左侧按钮**（第85-94行）：图标改为 `Info`，文字改为「介绍」，路由改为 `/awakening-system-intro`
- **右侧按钮**（第99-107行）：图标改为 `User`，文字改为「我的」，路由改为 `/profile`

即两个按钮的图标、文字、路由互换。

