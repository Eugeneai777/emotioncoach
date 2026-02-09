

## 问题诊断

### 根本原因

日志显示错误信息：
```
Error creating order: {
  code: "PGRST204",
  message: "Could not find the 'order_type' column of 'orders' in the schema cache"
}
```

**问题**：`orders` 表缺少两个必要的列，但边缘函数尝试写入它们：

| 缺失列 | 函数中的用途 |
|--------|-------------|
| `order_type` | 区分订单类型（如 `prepaid_recharge`、`package_purchase`） |
| `product_name` | 存储产品名称（如 `教练预付卡 ¥1000`） |

### 当前 orders 表结构

现有列：`id`, `user_id`, `package_key`, `package_name`, `amount`, `order_no`, `trade_no`, `status`, `qr_code_url`, `paid_at`, `expired_at`, `created_at`, `updated_at`, `pay_type`

### 受影响的功能

- `create-prepaid-alipay-order`（支付宝 H5 充值）
- `create-prepaid-recharge-order`（微信支付充值）

---

## 修复方案

### 方案一：添加缺失的数据库列（推荐）

为 `orders` 表添加两个新列：

```sql
-- 添加 order_type 列，用于区分订单类型
ALTER TABLE public.orders 
ADD COLUMN order_type TEXT DEFAULT 'package_purchase';

-- 添加 product_name 列（如果 package_name 已满足需求可复用）
-- 检查发现 package_name 已存在，可以用它替代 product_name
```

**注意**：发现 `package_name` 列已存在，可以复用它代替 `product_name`。

### 方案二：修改边缘函数以匹配现有表结构

移除或调整边缘函数中不存在的列引用。

---

## 推荐方案

采用**混合方案**：

1. **添加 `order_type` 列**：这是业务必需的字段，用于区分普通套餐购买 vs 预付卡充值
2. **复用 `package_name` 列**：用现有的 `package_name` 替代 `product_name`，无需新增列

### 数据库迁移

```sql
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'package_purchase';

COMMENT ON COLUMN public.orders.order_type IS '订单类型：package_purchase（套餐购买）、prepaid_recharge（预付卡充值）';
```

### 边缘函数修改

修改两个边缘函数，将 `product_name` 改为使用已存在的 `package_name` 列：

**`create-prepaid-alipay-order/index.ts`** 第 166-178 行：
```typescript
// 修改前
.insert({
  order_no: orderNo,
  ...
  order_type: 'prepaid_recharge',
  product_name: pkg.package_name,  // ← 列不存在
  ...
});

// 修改后
.insert({
  order_no: orderNo,
  ...
  order_type: 'prepaid_recharge',
  package_name: pkg.package_name,  // ← 使用已存在的列
  ...
});
```

**`create-prepaid-recharge-order/index.ts`** 第 57-67 行：
```typescript
// 修改前
.insert({
  order_no: orderNo,
  ...
  order_type: 'prepaid_recharge',
  product_name: pkg.package_name,  // ← 列不存在
});

// 修改后
.insert({
  order_no: orderNo,
  ...
  order_type: 'prepaid_recharge',
  package_name: pkg.package_name,  // ← 使用已存在的列
});
```

---

## 修改文件清单

| 文件 | 操作 |
|------|------|
| 数据库迁移 | 添加 `order_type` 列 |
| `supabase/functions/create-prepaid-alipay-order/index.ts` | 将 `product_name` 改为 `package_name` |
| `supabase/functions/create-prepaid-recharge-order/index.ts` | 将 `product_name` 改为 `package_name` |

