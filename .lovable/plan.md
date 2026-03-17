

## 方案 C 实施计划

### 修改内容

**文件**: `src/pages/MyPage.tsx`，第 106-111 行

在订单查询中增加 `.in("status", ["paid", "shipped", "completed", "refunded"])` 过滤条件。

**修改前**:
```typescript
const { data: orderData } = await supabase
  .from("orders")
  .select("id, order_no, package_name, amount, status, shipping_status, shipping_note, created_at")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(20);
```

**修改后**:
```typescript
const { data: orderData } = await supabase
  .from("orders")
  .select("id, order_no, package_name, amount, status, shipping_status, shipping_note, created_at")
  .eq("user_id", user.id)
  .in("status", ["paid", "shipped", "completed", "refunded"])
  .order("created_at", { ascending: false })
  .limit(20);
```

### 影响范围

- 仅影响 `/my-page` 页面的订单展示
- 不影响其他页面（管理后台、ShippingTracker、PartnerStoreOrders）
- 不影响后端数据，仅前端查询过滤

