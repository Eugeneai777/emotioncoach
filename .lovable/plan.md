

# 修复知乐订单数据看板 + 产品规格 UI

## 问题分析

### 问题1：订单看板缺少收货信息 & 只显示1条数据

**根因**：`handlePaySuccess` 在支付成功后尝试查询 `status = 'paid'` 的订单来回写收货信息，但此时存在两个问题：
- **时序问题**：微信支付回调可能尚未将订单状态改为 `paid`，导致查不到订单
- **游客问题**：`user_id = null` 的游客订单无法匹配 `eq('user_id', currentUser.id)`
- **实际数据**：数据库中所有 6 条已支付订单的 `buyer_name/buyer_phone/buyer_address` 全部为 null

**只显示1条**：ZhileOrdersDashboard 使用 anon key 查询，受 RLS 限制（`auth.uid() = user_id`），只能看到当前登录用户自己的订单。管理员虽有 admin RLS 策略，但该组件在合伙人详情页使用，合伙人不一定是 admin。

### 问题2：产品规格 UI 文字溢出

"16味草本精华科学配比" 在 `grid-cols-2 sm:grid-cols-4` 的小格子中显示，文字过长导致换行不美观、最后一个字单独成行。

## 修改方案

### 1. 修复收货信息保存时序（2个文件）

**`src/pages/SynergyPromoPage.tsx`** 和 **`src/pages/WealthSynergyPromoPage.tsx`**

将收货信息保存从 `handlePaySuccess`（支付后）提前到 `handleCheckoutConfirm`（填写地址后），并在创建订单时一并传入。同时改用 `order_no` 查询（通过 localStorage 暂存），而非依赖 `user_id + status`：

```typescript
const handleCheckoutConfirm = (info: CheckoutInfo) => {
  setCheckoutInfo(info);
  // 保存到 localStorage，供支付回调后使用
  localStorage.setItem('synergy_shipping_info', JSON.stringify(info));
  setStep('payment');
};

const handlePaySuccess = async () => {
  // 用 orderNo 精确匹配，而非 user_id + status
  const pendingOrderNo = localStorage.getItem('pending_claim_order');
  if (checkoutInfo && pendingOrderNo) {
    await supabase.from('orders').update({
      buyer_name: checkoutInfo.buyerName,
      buyer_phone: checkoutInfo.buyerPhone,
      buyer_address: checkoutInfo.buyerAddress,
      shipping_status: 'pending',
    }).eq('order_no', pendingOrderNo);
  }
  // fallback: 也按 user_id 尝试更新（已登录用户）
  if (checkoutInfo && user) {
    // 更新该用户最近的该 package 订单
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .eq('package_key', packageInfo.key)
      .is('buyer_name', null)
      .order('created_at', { ascending: false })
      .limit(1);
    if (recentOrders?.[0]) {
      await supabase.from('orders').update({
        buyer_name: checkoutInfo.buyerName,
        buyer_phone: checkoutInfo.buyerPhone,
        buyer_address: checkoutInfo.buyerAddress,
        shipping_status: 'pending',
      }).eq('id', recentOrders[0].id);
    }
  }
  // ...rest
};
```

同时在 `claim-guest-order` 边缘函数中，绑定用户时同步从 localStorage 传入的收货信息。

### 2. 修复看板 RLS 访问限制

**`src/components/partner/ZhileOrdersDashboard.tsx`**

改为通过 edge function 查询（使用 service_role），或者创建一个数据库视图/函数来绕过 RLS。

**推荐方案**：创建一个 security definer 函数 `get_zhile_orders()`，管理员或行业合伙人可调用：

```sql
CREATE OR REPLACE FUNCTION public.get_zhile_orders()
RETURNS SETOF orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM orders
  WHERE package_key IN ('synergy_bundle', 'wealth_synergy_bundle', 'zhile_capsules')
    AND status = 'paid'
  ORDER BY created_at DESC;
$$;
```

然后组件中调用 `supabase.rpc('get_zhile_orders')` 替代直接查表。

### 3. 修复产品规格 UI 布局

**`src/pages/SynergyPromoPage.tsx`** 和 **`src/pages/WealthSynergyPromoPage.tsx`**

将 specs 数据中 "16味草本精华科学配比" 简化显示值，并调整 grid 布局：

```typescript
const specs = [
  { label: "每瓶", value: "84粒" },
  { label: "每日用量", value: "3次" },
  { label: "持续天数", value: "28天" },
  { label: "核心成分", value: "16味草本" },  // 简化value
];
```

同时在规格卡片样式上添加 `break-all` 和 `text-sm` 替代 `text-lg`，防止长文本溢出：

```tsx
<p className="text-base font-bold text-cyan-400 leading-tight">{s.value}</p>
```

### 4. claim-guest-order 增加收货信息同步

**`supabase/functions/claim-guest-order/index.ts`**

在请求体中接受可选的 `shippingInfo` 参数，绑定用户时同时写入收货信息：

```typescript
const { orderNo, shippingInfo } = await req.json();

// 绑定用户时
const updateData: any = { user_id: userId, updated_at: new Date().toISOString() };
if (shippingInfo) {
  updateData.buyer_name = shippingInfo.buyerName;
  updateData.buyer_phone = shippingInfo.buyerPhone;
  updateData.buyer_address = shippingInfo.buyerAddress;
  updateData.shipping_status = 'pending';
}
```

**`src/hooks/useAuth.tsx`**：claim 时附带 localStorage 中的 shipping info。

## 涉及文件

- `src/pages/SynergyPromoPage.tsx` — 收货信息保存时序 + specs UI
- `src/pages/WealthSynergyPromoPage.tsx` — 同上
- `src/components/partner/ZhileOrdersDashboard.tsx` — 改用 RPC 查询
- `supabase/functions/claim-guest-order/index.ts` — 支持 shippingInfo
- `src/hooks/useAuth.tsx` — claim 时传入 shippingInfo
- 数据库迁移：创建 `get_zhile_orders()` 函数

