

# 健康商城 359 商品跳转有赞外链

## 方案

给 `health_store_products` 表新增 `external_url` 字段，为 359 商品填入有赞链接。点击购买时，有外链的商品直接跳转，跳过内部结算/支付流程。

## 改动计划

### 1. 数据库迁移
- `health_store_products` 表新增 `external_url text null` 字段
- 为 id=`920ee870-35e1-4246-80ff-9421743060e5` 的商品写入有赞链接

### 2. `src/components/store/HealthStoreGrid.tsx`
- `Product` 接口新增 `external_url` 字段
- `handleBuy` 函数：如果 `product.external_url` 存在，直接 `window.open(product.external_url, '_blank')` 跳转，不进入 checkout 流程

### 3. `src/components/store/ProductDetailDialog.tsx`
- `Product` 接口新增 `external_url` 字段
- 购买按钮文案：有外链时显示「前往购买 ¥359」，无外链保持「立即购买 ¥xxx」
- 按钮图标：有外链时用 ExternalLink 图标

### 不变项
- 无外链商品继续走内部支付流程
- 商品列表展示、分类、分享不变

