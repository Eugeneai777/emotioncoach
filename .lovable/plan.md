

# 同步支付优化：AssessmentPayDialog 缺少设备感知路由

## 问题

项目中有两套独立的支付组件：

| 组件 | 已优化？ | 使用页面 |
|------|----------|----------|
| `WechatPayDialog`（通过 `UnifiedPayDialog` 调用） | ✅ 已修复 | 推广页、训练营、合伙人、语音教练等 |
| `AssessmentPayDialog` | ❌ **未同步** | 财富卡点测评、情绪健康测评、死了吗、情绪SOS按钮、中年觉醒、觉醒测评 |

`AssessmentPayDialog` 的支付路由逻辑（第 482-492 行）：

```text
当前逻辑（有缺陷）:
  微信 + openId → jsapi ✅
  移动端 + 非微信 → alipay ✅
  其他（含微信无openId）→ native ← 问题！

正确逻辑（需同步）:
  微信 + openId → jsapi
  微信 + 无openId + 手机 → h5（按钮，避免长按拦截）
  微信 + 无openId + 电脑 → native（QR码，手机扫）
  移动端 + 非微信 → alipay
  桌面端 + 非微信 → native
```

**影响**：手机微信浏览器用户如果没有 openId（新用户、静默授权失败），会看到 native QR 码，而微信内长按 QR 码会被拦截 → 支付失败。

## 修改方案

### 文件：`src/components/wealth-block/AssessmentPayDialog.tsx`

**改动 1：支付路由逻辑（第 482-492 行）**

在 `isWechat && !!userOpenId` 和 `isMobile && !isWechat` 之间，插入微信无 openId 的设备区分：

```typescript
} else if (isWechat && !!userOpenId) {
  console.log("[Payment] WeChat browser with openId, using jsapi");
  selectedPayType = "jsapi";
} else if (isWechat && !userOpenId && isMobile) {
  // 手机微信无 openId → H5 支付按钮，避免长按 QR 被拦截
  console.log("[Payment] Mobile WeChat without openId, using H5 payment");
  selectedPayType = "h5";
} else if (isWechat && !userOpenId && !isMobile) {
  // 电脑微信无 openId → Native QR，用户手机扫码
  console.log("[Payment] Desktop WeChat without openId, using native QR");
  selectedPayType = "native";
} else if (isMobile && !isWechat) {
  console.log("[Payment] Mobile non-WeChat browser, using alipay");
  selectedPayType = "alipay";
} else {
  selectedPayType = "native";
}
```

**改动 2：QR 码提示文案（第 1138 行）**

将"请使用微信长按二维码或扫码支付"改为根据环境动态显示：
- 电脑微信环境 → "请使用手机微信扫一扫支付"
- 其他环境 → "请使用微信扫码支付"

## 受影响页面（无需改动，自动生效）

- `/wealth-block`（财富卡点测评）
- `/emotion-health-lite`（情绪健康测评）
- `/alive-check`（死了吗）
- `/emotion-button-lite`（情绪SOS按钮）
- `/midlife-awakening`（中年觉醒）
- `/awakening-lite`（觉醒测评）

