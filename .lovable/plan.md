
用户要求把「我的-充值」弹窗里 4 个套餐价格恢复为图片所示：
- 尝鲜会员 basic：¥9.9 / 50 点
- 标准会员 standard_49：¥49.9 / 300 点
- 畅享会员 premium_99：¥99 / 800 点
- 365会员 member365：¥365 / 1000 点

充值弹窗 `QuotaRechargeDialog.tsx` 走 `usePackages` 动态读 `packages` 表，所以只需改数据库 `packages` 表对应 4 行的 `price` 和 `ai_quota` 字段。无需代码改动。

## 执行
一条 SQL 更新（走 insert 工具，data update）：

```sql
UPDATE packages SET price = 9.9,  ai_quota = 50   WHERE package_key = 'basic';
UPDATE packages SET price = 49.9, ai_quota = 300  WHERE package_key = 'standard_49';
UPDATE packages SET price = 99,   ai_quota = 800  WHERE package_key = 'premium_99';
UPDATE packages SET price = 365,  ai_quota = 1000 WHERE package_key = 'member365';
```

## 注意
- 前端 `usePackages` 有 5 分钟 React Query 缓存，微信小程序内需退出重进或等缓存过期才能看到新价
- 不影响订单历史；只影响新发起的充值
