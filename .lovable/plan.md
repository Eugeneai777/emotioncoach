

## 将中心Logo按钮改为「有劲AI语音教练」入口

### 修改内容
**文件**: `src/components/awakening/AwakeningBottomNav.tsx`

1. **中心按钮行为**：将 `onClick` 从 `handleCenterClick`（打开快捷菜单）改为直接导航到 `/coach/vibrant_life_sage`（智能语音教练页面）
2. **视觉调整**：
   - 保留Logo图片和光晕动画效果
   - 在按钮下方添加「语音教练」文字标签
   - 移除菜单开关相关的旋转动画（按钮不再控制菜单）
3. **快捷菜单保留**：右侧「快捷」按钮仍可打开快捷菜单，中心按钮不再与菜单关联

### 技术细节
- 中心按钮 `onClick` → `navigate('/coach/vibrant_life_sage')`
- 移除中心按钮上 `isMenuOpen` 相关的样式切换和旋转动画
- 在按钮下方添加小文字标签「语音教练」
- 保留呼吸光晕和上下浮动动画

