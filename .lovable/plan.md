# 知乐订单看板增加"商品名称"列

## 现状分析

当前 `get_zhile_orders()` 数据库函数未返回商品名称字段。"金额"列已存在，但合伙方需要快速识别用户购买的是哪款产品（协同套餐 vs 知乐单品 vs 商城知乐）。

## 修改方案

### 1. 数据库函数：`get_zhile_orders()` 增加 `product_name` 返回字段

在三个 UNION ALL 分支中分别取：

- `orders` 表 → `o.package_name`
- `store_orders` 表 → `so.product_name`
- `orders` + `health_store_products` JOIN → `hsp.product_name`

### 2. 前端表格：`ZhileOrdersDashboard.tsx`

- 在"订单号"列后插入"商品名称"列，显示 `product_name`
- CSV 导出同步增加"商品名称"字段
- 搜索支持匹配商品名称

3.“下单时间”优化点：

其一、同时把原有的"下单时间"字段放到第一个字段，方便用户按时间顺序查看订单。

其二、有日期筛选订单功能，参考小鹅通管理后台订单筛选功能。

&nbsp;