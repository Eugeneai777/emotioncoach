

# 修复商城订单同步 + 数据看板优化

## 问题诊断

### 问题 1：商城购买的知乐产品不显示在数据看板
- 用户通过健康商城购买"知乐胶囊四瓶装"，订单创建在 `orders` 表，`package_key = 'store_product_59472a53...'`
- `get_zhile_orders()` 函数只筛选 `package_key IN ('synergy_bundle', 'wealth_synergy_bundle', 'zhile_capsules')`，**不包含 `store_product_%` 的订单**
- `store_orders` 表有 0 条记录（`handlePaySuccess` 插入可能静默失败），即使成功也需要产品名含"知乐"才会被查到
- `orders` 表中商城订单的 `buyer_name/buyer_phone/buyer_address` 全部为 NULL — 因为 `handlePaySuccess` 只写 `store_orders`，没有回写 `orders` 表

### 问题 2：可编辑字段范围不对
用户要求：收货人、手机号、地址应从下单时自动同步，管理员只能编辑**昵称、物流单号、物流状态**

### 问题 3：缺少订单时间字段
看板表格中需要增加订单时间列

## 修复方案

### 1. `HealthStoreGrid.tsx` — 支付成功后回写 orders 表收货信息

在 `handlePaySuccess` 中，找到最近创建的 `orders` 记录（通过 `package_key` 匹配），调用 `update-order-shipping` 写入 `buyer_name/buyer_phone/buyer_address`：

```typescript
// 查找刚创建的 orders 记录并回写收货信息
const { data: latestOrder } = await supabase
  .from('orders')
  .select('order_no')
  .eq('user_id', user.id)
  .eq('package_key', `store_product_${selectedProduct.id}`)
  .eq('status', 'paid')
  .order('created_at', { ascending: false })
  .limit(1).maybeSingle();

if (latestOrder?.order_no) {
  await supabase.functions.invoke('update-order-shipping', {
    body: { orderNo: latestOrder.order_no, shippingInfo: pendingCheckoutInfo }
  });
}
```

### 2. 数据库迁移 — 更新 `get_zhile_orders()` 函数

增加第三个 UNION ALL 分支，纳入 `orders` 表中 `package_key LIKE 'store_product_%'` 且关联到知乐产品的记录（通过 JOIN `health_store_products` 检查产品名含"知乐"）。

### 3. `ZhileOrdersDashboard.tsx` — 字段权限调整 + 订单时间

- 收货人、手机号、地址改为**只读展示**（移除 Input 编辑功能）
- 仅保留昵称、物流单号、物流状态为可编辑
- 表头新增"订单时间"列，显示 `created_at`

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/store/HealthStoreGrid.tsx` | handlePaySuccess 回写 orders 表收货信息 |
| `src/components/partner/ZhileOrdersDashboard.tsx` | 收货信息只读 + 增加订单时间列 |
| 数据库迁移 | 更新 `get_zhile_orders()` 包含商城知乐订单 |

