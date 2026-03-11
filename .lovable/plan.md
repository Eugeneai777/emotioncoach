

# 下架"知乐 35+ 身心觉醒包"

将 `health_store_products` 表中该商品的 `is_available` 设为 `false`。

**SQL**:
```sql
UPDATE health_store_products
SET is_available = false
WHERE id = '8a1d6c23-051b-4ea0-ae1e-4b04b762d364';
```

商品下架后不会在商城页面显示（查询已过滤 `is_available = true`），但数据保留，随时可重新上架。

