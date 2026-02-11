

## 修复所有用户显示"未设置昵称"的问题

### 根因

订单数据中存在 `user_id` 为 `null` 的记录。当前代码将所有订单的 `user_id`（包括 `null`）收集后传给 `.in()` 查询 profiles 表，PostgREST 收到 `null` 字符串后返回 400 错误（`invalid input syntax for type uuid: "null"`），导致 **整个 profiles 查询失败**，所有用户都显示"未设置昵称"。

### 解决方案

在构建 `userIds` 数组时过滤掉 `null` 值。

### 技术改动

**文件：`src/components/admin/OrdersTable.tsx`，第 77 行**

```typescript
// 修改前
const userIds = [...new Set(allOrders.map(o => o.user_id))];

// 修改后
const userIds = [...new Set(allOrders.map(o => o.user_id).filter(Boolean))];
```

一行改动即可修复。
