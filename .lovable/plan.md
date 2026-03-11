

# 物流单号同步：管理后台 → 用户已购订单

## 问题

当前用户的"已购订单"（`PurchaseHistory`）和"物流配送"（`ShippingTracker`）**只查询 `orders` 表**，而商城购买的知乐产品存储在 `store_orders` 表中。因此：

1. 用户在商城购买的知乐胶囊，在已购订单页面**完全不显示**
2. 合作方在后台填写的快递单号（写入 `store_orders.tracking_number`）用户无法看到

## 方案

### 1. `PurchaseHistory.tsx` — 合并 `store_orders` 数据

在查询中增加对 `store_orders` 表的查询（按 `buyer_id = user.id`），将结果合并到统一的购买记录列表中。映射字段：

| store_orders 字段 | → UnifiedPurchaseRecord 字段 |
|---|---|
| `product_name` | `name` |
| `price` | `amount` |
| `tracking_number` | `shipping_note` |
| `status` (paid/shipped/completed) | `shipping_status` (pending/shipped/delivered) |

### 2. `ShippingTracker.tsx` — 合并 `store_orders` 物流数据

同样增加对 `store_orders` 表中有 `buyer_address` 记录的查询，让商城订单的物流信息也显示在物流配送组件中。

### 3. 物流单号显示优化

在展开的物流详情中，将 `shipping_note`（即快递单号）以更醒目的方式展示，加上"快递单号："前缀标签，方便用户复制去查询物流。

## 涉及文件

| 文件 | 改动 |
|---|---|
| `src/components/PurchaseHistory.tsx` | 增加 store_orders 查询并合并 |
| `src/components/ShippingTracker.tsx` | 增加 store_orders 物流数据 |

无需数据库变更，管理后台写入 `store_orders.tracking_number` 的逻辑已正确工作。

