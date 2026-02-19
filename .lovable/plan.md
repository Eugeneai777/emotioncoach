

# 修复手工配对"暂无可选产品"问题

## 问题原因

手工配对模式查询商城商品时使用了错误的列名 `name`，但数据库中实际列名是 `product_name`，导致查询报错（HTTP 400），商城商品始终加载失败。

同时，当前查询限制了 `partner_id` 等于当前合伙人，但该合伙人可能没有自己上架的产品。根据需求"可以自己选择**全部**产品中心产品和商城商品"，应移除 `partner_id` 过滤，让用户看到所有可用产品。

## 修复内容

修改 `src/components/partner/AILandingPageWizard.tsx` 中的 `fetchManualProducts` 函数：

1. 将 `health_store_products` 查询的 `name` 改为 `product_name`
2. 移除两个查询中的 `partner_id` 过滤条件，展示全部可用产品
3. 统一展示时的字段名引用

## 技术细节

```text
修改前:
  .select("id, name, price, description")
  .eq("partner_id", partnerId)

修改后:
  .select("id, product_name, price, description")
  // 不限制 partner_id，展示全部可用商品
```

对 `partner_products` 同样移除 `partner_id` 过滤，并确保后续引用 `storeProducts` 时使用 `product_name` 而非 `name`。
