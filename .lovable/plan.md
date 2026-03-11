

# 修复知乐订单管理全链路问题

## 问题诊断

### 问题 1：后台数据看板收货信息全空白
数据库查询确认：6 笔 `orders` 表的知乐订单（synergy_bundle/wealth_synergy_bundle），`buyer_name`、`buyer_phone`、`buyer_address` 全部为 NULL。

**根因**：`ZhileProductsPage` 和 `SynergyPromoPage` 的 `handlePaySuccess` 依赖 `localStorage.getItem('pending_claim_order')` 获取订单号再调 `update-order-shipping` 写入收货信息。但 `pending_claim_order` 只在**游客下单**时设置（`WechatPayDialog` 内未登录才写入）。已登录用户付款成功后，localStorage 里没有这个值，收货信息**从未被保存**。

### 问题 2：物流状态切换"已发货"不生效
**根因**：合作方使用 `partner_admin` 角色登录后台。`orders` 表的 UPDATE 权限只有 `has_role(auth.uid(), 'admin')` 策略，`partner_admin` 无权更新。Supabase 返回 0 行更新但不报错，前端显示 toast "已更新" 实际数据没变。

### 问题 3：用户已购订单未显示物流入口
`PurchaseHistory` 中 `hasShipping` 判断条件是 `!!buyer_address`。因为收货信息没保存（问题1），所有知乐订单在用户端都不显示物流区域。即使修复了问题1，未发货的订单也应该显示物流入口并给出温馨提示。

## 修复方案

### 1. 修复收货信息保存（已登录用户）

**文件**：`src/pages/ZhileProductsPage.tsx`、`src/pages/SynergyPromoPage.tsx`、`src/pages/WealthSynergyPromoPage.tsx`

`handlePaySuccess` 中不再依赖 `pending_claim_order`。改为：从支付回调或当前状态中拿到订单号（通过 `WechatPayDialog`/`AlipayPayDialog` 的 `onSuccess` 回调传回 orderNo），直接调用 `update-order-shipping` 写入收货信息。

若 `onSuccess` 不传 orderNo，则使用最近创建的订单（通过查询 `orders` 表 `user_id + package_key + status='paid'` 最新一条）作为兜底。

### 2. 修复后台物流状态更新权限

**方案**：新增 `orders` 表 UPDATE RLS 策略，允许 `partner_admin` 角色更新物流字段：

```sql
CREATE POLICY "Partner admins can update order shipping"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'partner_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'partner_admin'));
```

同时在 `ZhileOrdersDashboard` 的 `updateShipping` mutation 中检查返回数据，若 0 行受影响则提示错误。

### 3. 用户端物流状态展示优化

**文件**：`src/components/PurchaseHistory.tsx`

- 修改 `hasShipping` 逻辑：知乐相关订单（package_key 含 synergy/zhile 或来自 store_orders）**始终显示物流区域**，不依赖 `buyer_address` 是否存在
- 未发货（shipping_status = pending 且无快递单号）显示温馨提示："📦 商品正在准备中，预计 3-5 个工作日内发货，请耐心等待"
- 已发货（有快递单号）显示快递单号，方便用户复制查询
- 已签收显示完成状态

### 4. 修复现有空数据（一次性补救）

为已有的 6 笔空收货信息订单，在 `ZhileOrdersDashboard` 中支持管理员**手动填写收货信息**（收货人/手机号/地址）。当前表格这些列只读显示 `-`，改为可编辑 Input（与快递单号列类似的 onBlur 保存）。

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/pages/ZhileProductsPage.tsx` | handlePaySuccess 直接保存收货信息到最新订单 |
| `src/pages/SynergyPromoPage.tsx` | 同上 |
| `src/pages/WealthSynergyPromoPage.tsx` | 同上 |
| `src/components/PurchaseHistory.tsx` | 物流区域始终显示 + 未发货温馨提示 |
| `src/components/partner/ZhileOrdersDashboard.tsx` | 收货信息列可编辑 + 更新错误处理 |
| 数据库迁移 | 新增 partner_admin UPDATE 策略 on orders |

