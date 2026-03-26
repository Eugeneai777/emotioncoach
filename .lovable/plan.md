

# 修复跨终端订单复用 pay_type 不匹配问题

## 问题

用户先在桌面端创建了 native（QR 码）订单，再从微信小程序进入时，后端复用了旧 native 订单并直接返回 QR 码，小程序无法使用 QR 码支付（需要 prepay_id）。

## 修复方案

**文件**：`supabase/functions/create-wechat-order/index.ts`

### 改动：在复用逻辑中增加 pay_type 匹配检查

在第 171-211 行的订单复用块中，增加判断：**如果请求的 payType 与已有订单的 pay_type 不同，跳过复用，创建新订单**。

具体改动位置在第 195 行附近：

```text
当前逻辑（第 195 行）：
  if (!reusedMiniProgramOrderNo && recentPending.qr_code_url) {
    → 直接返回旧 QR 码（不管请求方是 miniprogram 还是 jsapi）

修改后逻辑：
  // 仅当请求方也是 native 时才复用 QR 码
  // 如果请求方是 miniprogram/jsapi/h5，跳过复用，走新建订单流程
  if (!reusedMiniProgramOrderNo && recentPending.qr_code_url) {
    if (payType === 'native') {
      → 返回旧 QR 码
    }
    // 否则：小程序/JSAPI/H5 请求 → 跳过复用，继续创建新订单
  }
```

同时在小程序分支（第 175 行）也需兼容：当旧订单是 native（有 QR 码）而新请求是 miniprogram 时，允许用旧订单号重新调微信 API 获取 prepay_id：

```text
  if (payType === 'miniprogram') {
    if (openId) {
      // 不管旧订单是什么类型，用旧订单号重新获取 prepay_id
      reusedMiniProgramOrderNo = recentPending.order_no;
    } else {
      // 无 openId，返回等待原生端提供
      return { needsNativePayment: true }
    }
  }
```

## 流程对比

```text
修复前：
  桌面 native 订单(有QR) → 小程序请求 → 返回 QR 码 → 小程序无法使用 → 失败

修复后：
  桌面 native 订单(有QR) → 小程序请求 → 检测 payType 不匹配
  → 用旧订单号重新调微信 API 获取 miniprogram prepay_id → 成功
```

## 不受影响

- 同类型复用（native→native, jsapi→jsapi）行为不变
- 支付金额、权益发放逻辑不变
- 其他页面和支付入口不受影响

