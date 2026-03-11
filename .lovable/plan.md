

# 修复知乐订单收货信息缺失

## 根因分析

**所有 6 条已支付订单的 buyer_name/buyer_phone/buyer_address 均为 NULL。**

原因是 `handlePaySuccess` 在支付成功后通过**客户端 SDK** 直接 `.update()` orders 表，但 orders 表的 RLS UPDATE 策略要求 `auth.uid() = user_id` 或 admin。两种场景都失败：

1. **游客用户**：无 auth session → 所有 RLS 策略都不匹配 → 更新被静默拒绝
2. **已登录用户**：订单可能此时还未被支付回调标记为 `paid`（时序问题），或 `user_id` 仍为 null

**同时 ZhileProductsPage 使用了错误的列名** (`shipping_name` 而非 `buyer_name`)。

## 解决方案

创建一个 **edge function `update-order-shipping`**，使用 service_role 绕过 RLS 更新收货信息。所有页面改为调用此函数。

### 1. 新建 Edge Function `supabase/functions/update-order-shipping/index.ts`

接收 `{ orderNo, shippingInfo }` 参数，用 service_role 更新 orders 表：
- 按 order_no 查找订单
- 写入 buyer_name、buyer_phone、buyer_address、shipping_status='pending'
- 无需用户身份验证（支付完成时可能是游客状态）
- 但验证 order_no 存在且为 paid 状态

### 2. 修改 `src/pages/SynergyPromoPage.tsx` — handlePaySuccess

将直接 `.update()` 替换为调用 `update-order-shipping` 边缘函数：
```typescript
const handlePaySuccess = async () => {
  if (checkoutInfo) {
    const pendingOrderNo = localStorage.getItem('pending_claim_order');
    if (pendingOrderNo) {
      await supabase.functions.invoke('update-order-shipping', {
        body: { orderNo: pendingOrderNo, shippingInfo: checkoutInfo }
      });
    }
  }
  // ...rest unchanged
};
```

### 3. 修改 `src/pages/WealthSynergyPromoPage.tsx` — 同上

### 4. 修改 `src/pages/ZhileProductsPage.tsx` — 同上

修复列名错误 + 改用 edge function。

### 5. 一次性数据修补

现有 6 条已支付订单的收货信息需要从 localStorage 无法恢复（已过期），但未来新订单将正确写入。

## 涉及文件

- 新建 `supabase/functions/update-order-shipping/index.ts`
- `src/pages/SynergyPromoPage.tsx` — handlePaySuccess
- `src/pages/WealthSynergyPromoPage.tsx` — handlePaySuccess  
- `src/pages/ZhileProductsPage.tsx` — handlePaySuccess + 修复列名

