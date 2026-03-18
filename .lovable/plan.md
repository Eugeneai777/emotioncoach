

## 修改方案

**文件**: `src/components/awakening/AwakeningBottomNav.tsx`

从 `quickActions` 数组（第36-43行）中删除以下三项：
- `profile`（我的）
- `courses`（学习课程）
- `products`（产品中心）

保留：
- `feedback`（建议）
- `emotion`（情绪按钮）
- `coach`（教练空间）

纯 UI 快捷入口删除，不影响任何业务逻辑，对应页面仍可通过其他导航访问。

