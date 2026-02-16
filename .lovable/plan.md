

## 支持"先支付，后登录"流程

### 现状分析

当前后端已支持游客下单（`user_id` 可为空），但支付回调（`wechat-pay-callback`）通过 `order.user_id` 发放权益（配额、训练营开通等）。如果订单没有 `user_id`，支付成功但权益不会到账。

### 改动方案

#### 1. 前端：允许未登录用户直接打开支付弹窗

| 文件 | 修改 |
|------|------|
| `src/pages/WealthCampIntro.tsx` | 移除登录检查，直接打开支付弹窗 |
| `src/components/WechatPayDialog.tsx` | 当 `user` 为空时，以 `guest` 身份创建订单，不再显示空白 |
| `src/components/AlipayPayDialog.tsx` | 同上，支持 guest 下单 |

#### 2. 前端：支付成功后引导登录/注册

| 文件 | 修改 |
|------|------|
| `src/components/WechatPayDialog.tsx` | 支付成功后，如果用户未登录，显示"支付成功，请登录/注册以激活权益"界面，并将 `orderNo` 存入 `localStorage` |
| `src/components/AlipayPayDialog.tsx` | 同上 |

#### 3. 后端：新增"订单认领"边缘函数

| 文件 | 说明 |
|------|------|
| `supabase/functions/claim-guest-order/index.ts` | 新建。用户登录后自动调用，将 `user_id` 为空且 `order_no` 匹配的已支付订单绑定到当前用户，并触发权益发放（配额增加 / 训练营开通） |

核心逻辑：
- 接收 `orderNo` + 用户 JWT
- 校验：订单存在、`status = 'paid'`、`user_id IS NULL`
- 更新 `orders.user_id` 为当前用户
- 复用 `wechat-pay-callback` 中的权益发放逻辑（增加配额 / 开通训练营）

#### 4. 前端：登录后自动认领订单

| 文件 | 修改 |
|------|------|
| `src/hooks/useAuth.tsx` | 在 `SIGNED_IN` 事件中，检查 `localStorage` 是否有待认领的 `orderNo`，如有则调用 `claim-guest-order` |

### 完整流程

```text
用户未登录 --> 点击"购买训练营"
    |
  打开支付弹窗（guest 模式）
    |
  创建订单（user_id = null）
    |
  微信扫码 / 支付宝支付
    |
  支付成功
    |
  弹窗显示"支付成功！请登录以激活权益"
    |
  localStorage 存储 orderNo
    |
  用户登录或注册
    |
  useAuth 检测到 SIGNED_IN + 待认领订单
    |
  调用 claim-guest-order
    |
  订单绑定用户 + 权益发放
    |
  完成
```

### 安全考虑

- `claim-guest-order` 仅允许认领 `user_id IS NULL` 的订单，防止抢占他人订单
- 订单认领后 `user_id` 被设置，不可再次认领
- 认领操作需要有效的用户 JWT

### 改动范围

- 修改 4 个文件，新建 1 个边缘函数
- 无需新增数据库表（`orders.user_id` 已支持 NULL）
- 权益发放逻辑从 callback 中提取复用
