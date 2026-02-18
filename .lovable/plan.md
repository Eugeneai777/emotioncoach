

# 行业合伙人商城权限：自营商品上架 + 订单管理

## 目标

只有行业合伙人（`partner_type = 'industry'`）可以在健康商城上架自有商品，用户购买后订单信息自动通知合伙人发货。

## 现状分析

| 组件 | 现状 |
|------|------|
| `health_store_products` 表 | 无 `partner_id` 字段，仅管理员可管理 |
| `partner_products` 表 | 行业合伙人的产品包（用于飞轮系统），非商城商品 |
| `HealthStoreGrid.tsx` | 展示商品 + 跳转小程序，无直接购买能力 |
| 行业合伙人管理页 | 仅管理合伙人基本信息和飞轮 Campaign |

## 实施步骤

### 1. 数据库改造

**扩展 `health_store_products` 表**，新增字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| partner_id | UUID (可选) | 关联 `partners.id`，NULL 为平台自营 |
| stock | INTEGER (默认 -1) | 库存，-1 不限 |
| sales_count | INTEGER (默认 0) | 销量 |
| detail_images | TEXT[] | 详情图数组 |
| shipping_info | TEXT | 配送说明 |
| contact_info | TEXT | 合伙人联系方式（发货用） |

**新建 `store_orders` 表**（商城订单）：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| order_no | TEXT | 订单号（自动生成） |
| buyer_id | UUID | 买家 |
| product_id | UUID | 商品 |
| partner_id | UUID | 卖家合伙人 |
| product_name | TEXT | 商品名快照 |
| price | NUMERIC | 价格 |
| quantity | INTEGER | 数量 |
| status | TEXT | pending/paid/shipped/completed |
| buyer_name | TEXT | 收货人 |
| buyer_phone | TEXT | 电话 |
| buyer_address | TEXT | 地址 |
| tracking_number | TEXT | 物流单号 |
| payment_order_id | UUID | 关联支付订单 |
| paid_at / shipped_at | TIMESTAMPTZ | 时间戳 |

**RLS 策略**：
- `health_store_products`：行业合伙人可 INSERT/UPDATE/DELETE 自己的商品
- `store_orders`：买家可查看自己的订单；合伙人可查看并更新自己店铺的订单
- 商品 SELECT 对所有人开放（`is_available = true`）

### 2. 合伙人商品管理（卖家端）

**新建 `src/components/partner/PartnerStoreProducts.tsx`**：
- 行业合伙人在飞轮系统中新增"我的商城"Tab
- 上架商品：名称、价格、原价、图片（上传到 `partner-assets` 桶）、描述、分类、标签、库存、配送说明
- 编辑/下架切换
- 查看销量统计

**新建 `src/components/partner/PartnerStoreOrders.tsx`**：
- 展示该合伙人收到的所有订单
- 订单状态筛选（待发货/已发货/已完成）
- 查看买家信息（姓名、电话、地址）
- 填写物流单号并标记发货

### 3. 买家购买流程

**改造 `HealthStoreGrid.tsx`**：
- 点击商品弹出详情弹窗（大图、描述、配送信息）
- 点击"立即购买"弹出收货信息表单（姓名、电话、地址）
- 确认后调用 `UnifiedPayDialog` 支付
- 支付成功后创建 `store_orders` 记录

**新建组件**：
- `ProductDetailDialog.tsx`：商品详情弹窗
- `CheckoutForm.tsx`：收货信息表单

### 4. 订单通知

**新建 `supabase/functions/notify-store-order/index.ts`**：
- 支付成功后触发
- 创建站内通知（`smart_notifications` 表）通知合伙人有新订单
- 通知内容：商品名称、金额、买家收货信息

### 5. 管理后台增强

在 `IndustryPartnerManagement.tsx` 的飞轮详情页中，新增两个 Tab：
- **商城商品**：查看该合伙人上架的所有商品
- **商城订单**：查看该合伙人收到的所有订单及发货状态

## 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| 数据库迁移 | 新建 | 扩展 `health_store_products` + 新建 `store_orders` + RLS |
| `src/components/store/HealthStoreGrid.tsx` | 改造 | 移除小程序跳转，增加详情弹窗 + 支付购买 |
| `src/components/store/ProductDetailDialog.tsx` | 新建 | 商品详情弹窗 |
| `src/components/store/CheckoutForm.tsx` | 新建 | 收货信息表单 |
| `src/components/partner/PartnerStoreProducts.tsx` | 新建 | 合伙人商品上架管理 |
| `src/components/partner/PartnerStoreOrders.tsx` | 新建 | 合伙人订单管理 |
| `src/components/partner/PartnerFlywheel.tsx` | 修改 | 增加"商城"和"订单"Tab |
| `supabase/functions/notify-store-order/index.ts` | 新建 | 订单通知 |

## 用户流程

```text
卖家（行业合伙人）：
  飞轮系统 → 我的商城 → 上架商品（填写信息+上传图片）
  → 收到新订单通知 → 查看订单详情 → 填写物流单号 → 发货完成

买家：
  健康商城 → 点击商品 → 查看详情 → 立即购买
  → 填写收货地址 → 支付 → 等待发货 → 收货
```
