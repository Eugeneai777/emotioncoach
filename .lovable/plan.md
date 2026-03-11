

# 修复：电脑微信点击"立即支付"白屏 + 无二维码

## 问题根因

上次修复（微信内长按二维码被拦截）时，把 `isWechat && !userOpenId` 统一改成了 H5 支付。但这导致：

- **电脑微信**（Windows/Mac 微信内置浏览器）：H5 支付链接跳转后白屏 — 微信 H5 支付仅支持手机浏览器，电脑端无法处理
- **手机微信浏览器**：原来的 QR 码被替换成了"立即支付"按钮，但按钮点击后跳转也可能被微信拦截

```text
当前逻辑（有问题）:
  isWechat && !openId → h5（不区分手机/电脑）

正确逻辑:
  isWechat && !openId && isMobile → h5 + "立即支付"按钮
  isWechat && !openId && !isMobile → native QR（电脑用户手机扫码）
```

## 修复方案

### 文件：`src/components/WechatPayDialog.tsx`

**改动 1：支付类型选择逻辑（第 782-785 行）**

将微信无 openId 的分支按设备区分：

```typescript
} else if (isWechat && !userOpenId && isMobile) {
  // 手机微信浏览器无 openId → H5 支付，避免长按 QR 被拦截
  console.log('[Payment] Mobile WeChat without openId, using H5 payment');
  selectedPayType = 'h5';
} else if (isWechat && !userOpenId && !isMobile) {
  // 电脑微信无 openId → Native QR 码，用户手机扫码支付
  console.log('[Payment] Desktop WeChat without openId, using native QR');
  selectedPayType = 'native';
}
```

**改动 2：Native QR 提示文案优化（第 1469-1491 行）**

电脑微信环境下，将"长按二维码"改为"请使用手机微信扫一扫支付"，因为电脑端不存在长按操作。

### 文件：`supabase/functions/create-wechat-order/index.ts`

**改动 3：保存 pay_type 到订单（第 514-527 行）**

当前 INSERT 语句缺少 `pay_type` 字段，导致所有订单的 `pay_type` 为 NULL。数据看板无法区分支付方式。在 INSERT 和小程序无 openId 的 INSERT（第 288-303 行）中都补上 `pay_type` 字段。

## 修改总结

| 改动 | 影响 |
|------|------|
| 电脑微信恢复 Native QR | 修复白屏，恢复二维码 |
| 手机微信保持 H5 + 按钮 | 避免长按拦截 |
| 订单写入 pay_type | 数据看板可追踪支付方式 |

