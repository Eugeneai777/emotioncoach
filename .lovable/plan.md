

## 将底部导航栏「我的」改为「快捷」按钮

### 修改内容
**文件**: `src/components/awakening/AwakeningBottomNav.tsx`

- 右侧按钮从「我的」(User 图标, 跳转 /profile) 改为「快捷」按钮
- 图标换为 `Zap`（已导入）
- 点击时触发 `handleCenterClick`（与中心按钮相同，打开快捷菜单）
- 文字改为「快捷」

