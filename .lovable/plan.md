

## 客服入口恢复方案

移除「快捷服务」后，用户失去了联系客服的唯一入口。最合理的位置是在「我的」页面的设置区域新增「联系客服」按钮，点击后弹出已有的 `TextCustomerSupport` 文字客服组件。

### 改动文件

**`src/pages/MyPage.tsx`**

1. 在 `SETTINGS_ITEMS` 数组中，在「退出登录」之前新增一项：`{ icon: Headphones, label: "联系客服" }`（使用 `Headphones` 图标，与 admin 侧栏保持一致）
2. 新增 state `showCustomerSupport`
3. `handleSettingsClick` 添加 `case "联系客服"` → `setShowCustomerSupport(true)`
4. JSX 底部添加条件渲染：当 `showCustomerSupport` 为 `true` 时，以固定定位弹层形式展示 `TextCustomerSupport`，传入 `onClose` 关闭
5. import 新增 `Headphones` 和 `TextCustomerSupport`

### 不影响项
- 现有设置项（提醒设置、通知偏好、退出登录）不变
- 底部导航不变
- 其他页面不变

