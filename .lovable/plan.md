

## 修复付费状态显示不正确的问题

### 根因分析

当前查询使用 `.limit(1).maybeSingle()` 检查用户是否有已支付订单。问题在于：多个用户有多条 `paid` 状态的订单，`maybeSingle()` 在某些情况下会因为底层匹配到多行而返回错误（即使有 `limit(1)`），导致 `paidOrderResult.data` 为 `null`，页面显示"未付费"。

### 解决方案

将 `maybeSingle()` 替换为普通数组查询，检查数组是否非空来判断付费状态。

### 技术改动

文件：`src/components/admin/UserAccountsTable.tsx`

**查询部分（第 58-64 行）**：

```typescript
// 修改前
supabase
  .from('orders')
  .select('id, package_key')
  .eq('user_id', account.user_id)
  .eq('status', 'paid')
  .limit(1)
  .maybeSingle()

// 修改后
supabase
  .from('orders')
  .select('id')
  .eq('user_id', account.user_id)
  .eq('status', 'paid')
  .limit(1)
```

**数据映射部分（第 72 行）**：

```typescript
// 修改前
paidOrder: paidOrderResult.data

// 修改后
paidOrder: paidOrderResult.data && paidOrderResult.data.length > 0
```

这样 `paidOrder` 变为布尔值，模板中 `account.paidOrder` 的判断逻辑不需要改动。
