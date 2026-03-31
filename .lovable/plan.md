

# 修复训练营"已购买"误判问题

## 问题分析
`hasPurchased` 由两个查询决定（第160行）：
- `useCampPurchase` → 查 `user_camp_purchases` 表（`payment_status = 'completed'`）
- `orderPurchase` → 查 `orders` 表（`status = 'paid'`）

数据库中存在多条 `user_camp_purchases` 记录虽然 `payment_status = 'completed'`，但在 `orders` 表中**没有对应的已支付订单**。这导致未实际付款的用户看到"已购买，立即开始"。

可能原因：自愈机制 / `onSuccess` 回调在非支付场景被触发 / 边缘函数异常写入。

## 改动计划

### 1. `src/pages/CampIntro.tsx` — 加强购买验证逻辑

- **将 `orders` 表作为购买状态的主要判据**：`hasPurchased` 改为必须在 `orders` 表中有 `status = 'paid'` 的记录才算已购买
- 移除对 `useCampPurchase`（`user_camp_purchases` 表）的单独信任，改为：`hasPurchased = !!orderPurchase`
- 或者采用双表交叉验证：两个查询都返回记录才算 `hasPurchased = true`

- **增加 loading 状态保护**：在购买状态查询未完成时，按钮显示"加载中"或默认显示购买价格，避免闪烁

### 2. 具体代码变更

```typescript
// 当前（有问题）
const hasPurchased = !!purchaseRecord || !!orderPurchase;

// 修复：以 orders 表（财务事实来源）为准
const { data: orderPurchase, isLoading: orderLoading } = useQuery({ ... });
const hasPurchased = !!orderPurchase;
```

按钮文字增加 loading 保护：
```typescript
{orderLoading 
  ? '加载中...' 
  : hasJoinedCamp 
  ? '继续训练' 
  : hasPurchased 
  ? '已购买，立即开始' 
  : (campTemplate.price && campTemplate.price > 0)
  ? `立即购买 ¥${campTemplate.price}` 
  : '立即加入训练营'}
```

## 不变项
- 不改路由、不改数据库
- 保留 `useCampPurchase` hook（其他页面可能依赖），只是 CampIntro 不再以它为唯一判据
- 支付成功后的 `user_camp_purchases` 插入逻辑保持不变（作为辅助记录）

