

# 修复收货信息同步 — 从根本上解决

## 根因分析

**现有方案为什么不行？** 当前的"后补"逻辑（backfill）在 `handlePaySuccess` 中执行，但存在致命缺陷：

1. `pendingCheckoutInfo` 存储在 React state 中，微信授权重定向或支付宝跳转会导致**页面刷新、state 丢失**
2. 即使不刷新，该逻辑依赖查询 `orders` 表再调用 edge function 更新，链路过长、中间任何一步失败都会导致数据丢失
3. 数据库实际结果证实：**所有 `store_product_` 订单的 buyer_name/phone/address 全部为 NULL**

## 修复方案：在订单创建时直接写入收货信息

将收货信息通过支付链路传递到订单创建的 edge function 中，**在创建订单的 INSERT 语句中直接写入**，彻底消除后补逻辑的不可靠性。

### 数据流

```text
CheckoutForm → HealthStoreGrid → UnifiedPayDialog → WechatPayDialog/AlipayPayDialog
                (shippingInfo)     (shippingInfo)      → create-wechat-order / create-alipay-order
                                                          INSERT INTO orders (..., buyer_name, buyer_phone, buyer_address)
```

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/UnifiedPayDialog.tsx` | 新增 `shippingInfo?` prop，透传给子组件 |
| `src/components/WechatPayDialog.tsx` | 新增 `shippingInfo?` prop，在 `createOrder` 时传给 edge function |
| `src/components/AlipayPayDialog.tsx` | 同上 |
| `supabase/functions/create-wechat-order/index.ts` | 接收 `buyerName/buyerPhone/buyerAddress`，写入 orders INSERT |
| `supabase/functions/create-alipay-order/index.ts` | 同上 |
| `src/components/store/HealthStoreGrid.tsx` | 传递 `shippingInfo` 给 UnifiedPayDialog，移除 handlePaySuccess 中失败的 backfill 逻辑 |

### 关键改动细节

**1. UnifiedPayDialog — 增加 shippingInfo 透传**
```typescript
interface UnifiedPayDialogProps {
  // ... existing
  shippingInfo?: { buyerName: string; buyerPhone: string; buyerAddress: string };
}
// 透传给 WechatPayDialog 和 AlipayPayDialog
```

**2. WechatPayDialog/AlipayPayDialog — createOrder 时传递**
```typescript
// create-wechat-order body 中增加：
buyerName: shippingInfo?.buyerName,
buyerPhone: shippingInfo?.buyerPhone,
buyerAddress: shippingInfo?.buyerAddress,
```

**3. Edge Functions — INSERT 时直接写入**
```sql
INSERT INTO orders (
  ..., buyer_name, buyer_phone, buyer_address, shipping_status
) VALUES (
  ..., buyerName, buyerPhone, buyerAddress, 'pending'
)
```

**4. HealthStoreGrid — 移除 backfill，传递 shippingInfo**
```typescript
<UnifiedPayDialog
  shippingInfo={pendingCheckoutInfo ? {
    buyerName: pendingCheckoutInfo.buyerName,
    buyerPhone: pendingCheckoutInfo.buyerPhone,
    buyerAddress: pendingCheckoutInfo.buyerAddress,
  } : undefined}
/>
```

### 同时修复已有数据

通过数据库 UPDATE 将 `store_orders` 表中已有的收货信息回填到 `orders` 表中对应的记录，修复历史数据。

