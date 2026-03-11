

# 修复：微信浏览器内长按二维码支付被拦截

## 问题根因

截图显示微信提示"该商户暂时不支持通过长按识别二维码完成支付"。

**原因**：微信浏览器中无 openId 的用户，支付类型选择逻辑走到了 `native`（第 785 行），生成了一个 Native 支付二维码图片。用户在微信内长按该二维码 → 微信识别后发现是 Native 支付链接，但**微信不允许长按识别 Native QR 码支付**（只允许扫码枪/相机扫码）。

```text
代码路径：
isWechat && !!userOpenId → false（无openId）
isMobile && !isWechat   → false（是微信）
→ 走到 else: selectedPayType = 'native' ← 问题所在
```

## 修复方案

**在微信浏览器 + 无 openId 的场景下，使用 H5 支付而不是 Native 支付**。H5 支付会生成一个可直接跳转的支付链接，用户点击按钮即可跳转到微信支付收银台，不需要扫码。

### 改动：`src/components/WechatPayDialog.tsx`

**1. 支付类型选择（第 779-786 行）**

将微信浏览器无 openId 的分支从 `native` 改为 `h5`：

```typescript
} else if (isWechat && !!userOpenId) {
  selectedPayType = 'jsapi';
} else if (isWechat && !userOpenId) {
  // 微信浏览器但无 openId → 用 H5 支付，避免 Native QR 码长按被拦截
  console.log('[Payment] WeChat browser without openId, using H5 payment');
  selectedPayType = 'h5';
} else if (isMobile && !isWechat) {
  selectedPayType = 'h5';
} else {
  selectedPayType = 'native';
}
```

**2. H5 支付在微信内的 UI 优化（第 1294-1312 行）**

当 `isWechat && payType === 'h5'` 时，不显示二维码图片（长按无法用），而是直接显示一个"立即支付"按钮，通过 `window.location.href` 跳转到 H5 支付链接。

**3. H5 提示文案调整（第 1376-1403 行）**

微信内环境下，提示文案从"复制链接到微信中打开"改为"点击下方按钮完成支付"，并显示醒目的跳转按钮。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/WechatPayDialog.tsx` | 支付类型选择逻辑 + H5 UI 微信内适配 |

