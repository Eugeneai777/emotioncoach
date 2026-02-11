

## 在订单表格中点击用户弹出详情窗口

### 目标

在订单管理页面中，点击表格中的用户头像/昵称区域，弹出用户详情窗口（复用已有的 `UserDetailDialog` 组件）。

### 现状

- 项目已有完善的 `UserDetailDialog` 组件，包含用户概览、使用记录、购买记录三个标签页
- 该组件目前仅在"用户管理"页面（`UserAccountsTable`）中使用
- 订单表格中的用户信息目前是纯文本展示，不可点击

### 改动内容

**文件：`src/components/admin/OrdersTable.tsx`**

1. **引入组件**：导入 `UserDetailDialog`
2. **新增状态**：
   - `selectedUser`：记录当前选中的用户信息（userId, userName, avatarUrl）
   - `detailDialogOpen`：控制弹窗显示/隐藏
3. **用户单元格改为可点击**：在表格的"用户"列添加 `onClick` 和 `cursor-pointer` 样式，点击时设置选中用户并打开弹窗
4. **渲染弹窗**：在组件底部渲染 `UserDetailDialog`

### 交互效果

```text
订单表格
  |
  +-- 点击用户头像/昵称 --> 弹出 UserDetailDialog
       |
       +-- 概览标签：对话数、简报数、教练会话、社区发帖
       +-- 使用标签：详细使用记录
       +-- 购买标签：购买历史
```

### 技术细节

- 不需要新建组件，完全复用现有 `UserDetailDialog`
- 仅修改 `OrdersTable.tsx` 一个文件
- 用户单元格增加悬停高亮效果（`hover:text-primary`），提示可点击

