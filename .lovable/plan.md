

# 为1159元四瓶装商品设置有赞外部链接

## 方案

通过数据库迁移更新 `health_store_products` 表中四瓶装商品（ID: `59472a53-195c-4963-9fe9-b13fbdc3db77`）的 `external_url` 字段。

### SQL 迁移

```sql
UPDATE health_store_products 
SET external_url = 'https://shop138837377.m.youzan.com/wscgoods/detail/26x5yk7m5xg6hyx?scan=1&activity=none&from=kdt&qr=directgoods_3808287996&shopAutoEnter=1'
WHERE id = '59472a53-195c-4963-9fe9-b13fbdc3db77';
```

无需改动代码——现有的 `HealthStoreGrid` 和 `ProductDetailDialog` 已支持 `external_url` 跳转逻辑（按钮自动变为"前往购买"并跳转有赞商城）。

### 文件变更

| 文件 | 操作 |
|---|---|
| 数据库迁移 | UPDATE 1行，设置 external_url |

