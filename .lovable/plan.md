

# 修复协同抗压套餐完整购买链路

## 问题根因分析

| 问题 | 根因 |
|------|------|
| 购买后进入训练营仍要付费 | `synergy_bundle` 的 package_key 不以 `camp-` 开头，支付回调不会写入 `user_camp_purchases` 表；而 `CampIntro.tsx` 的底部按钮通过 `useCampPurchase` 检查该表来决定是否显示"购买" |
| 同一账号退回再进入仍显示购买页 | `SynergyPromoPage.tsx` 没有检查用户是否已购买过 `synergy_bundle`，每次进入都是 `step='browse'` |
| 支付加载慢 | 结账表单关闭后才打开支付弹窗，两个弹窗串行。可以在结账确认时预创建订单 |
| 看不到地址和物流信息 | `ShippingTracker` 放在「设置→账户」，但用户不知道去哪找；购买成功面板没有直达入口 |

## 修改方案

### 1. 支付回调补写训练营购买记录（关键修复）

**文件**: `supabase/functions/wechat-pay-callback/index.ts` + `supabase/functions/check-order-status/index.ts`

在处理 `synergy_bundle` 订单时，除了写 subscription，额外写一条 `user_camp_purchases` 记录：
```
camp_type: 'emotion_journal_21'
payment_status: 'completed'
```
这样用户进入训练营介绍页时 `useCampPurchase` 能找到购买记录，不再要求付费。

### 2. SynergyPromoPage 已购检测

**文件**: `src/pages/SynergyPromoPage.tsx`

- 页面加载时查询 `orders` 表，检查当前用户是否有 `synergy_bundle` 的 `paid` 订单
- 如已购买：直接显示「已购买」状态，提供「进入训练营」和「查看物流」按钮，替代购买按钮
- 同时查询 `user_camp_purchases` 确保训练营已开通

### 3. 购买成功页优化

**文件**: `src/pages/SynergyPromoPage.tsx` (SuccessPanel)

- 添加「查看订单与物流」按钮，跳转到 Settings 的 account tab
- 显示收货地址摘要（从 checkoutInfo 中获取）
- 进入训练营按钮改为直接跳转到 `/camps`（训练营列表）或开始对话

### 4. 训练营介绍页识别套餐购买

**文件**: `src/hooks/useCampPurchase.ts`

扩展兼容映射，使 `emotion_journal_21` 也检查 `synergy_bundle` 的购买记录（双保险）。

### 5. 支付流程优化

**文件**: `src/pages/SynergyPromoPage.tsx`

- 结账确认后立即打开支付弹窗（当前已是这样，但确保 `CheckoutForm` dialog 关闭时不重置 step）

### 文件变更清单

| 文件 | 变更 |
|------|------|
| `supabase/functions/wechat-pay-callback/index.ts` | synergy_bundle 支付成功时写入 user_camp_purchases |
| `supabase/functions/check-order-status/index.ts` | 同上，自愈逻辑也补写 |
| `src/pages/SynergyPromoPage.tsx` | 加已购检测、优化成功页、显示物流入口 |
| `src/hooks/useCampPurchase.ts` | emotion_journal_21 兼容 synergy_bundle 购买 |
| `src/components/store/CheckoutForm.tsx` | 无功能变更（已有物流提示） |

