

# 修复小程序支付「appid和openid不匹配」错误

## 问题根因

三个落地页（SynergyPromoPage、WealthSynergyPromoPage、ZhileHavrutaPromoPage）的「微信支付 openId 预加载」逻辑从 `wechat_user_mappings` 表查出**公众号 openid**，传给 `WechatPayDialog`。在小程序环境中，公众号 openid 与小程序 appid 不匹配，导致微信 JSAPI 报错。

## 修复方案（3个文件，每个改2处，零业务逻辑变更）

### 改动 1：SynergyPromoPage.tsx
- **第 348 行**：openId 预加载条件增加 `isWeChatMiniProgram()` 判断，小程序环境跳过预加载
- **第 968 行**：传给 WechatPayDialog 的 `openId` prop 增加小程序判断，小程序下传 `undefined`

### 改动 2：WealthSynergyPromoPage.tsx
- **第 337 行**：同上，预加载条件增加小程序排除
- 传给 WechatPayDialog 的 `openId` prop 同上处理

### 改动 3：ZhileHavrutaPromoPage.tsx
- **第 274 行**：同上，预加载条件增加小程序排除
- 传给 WechatPayDialog 的 `openId` prop 同上处理

### 具体代码变更示例（以 SynergyPromoPage 为例）

预加载处：
```typescript
const isWechat = /MicroMessenger/i.test(navigator.userAgent);
const isMiniProg = isWeChatMiniProgram();
if (!isWechat || isMiniProg || paymentOpenId) return;
```

传 prop 处：
```tsx
openId={isWeChatMiniProgram() ? undefined : paymentOpenId}
```

## 不受影响的内容

- 微信浏览器（非小程序）支付流程不变，仍使用公众号 openid
- 支付宝支付、桌面端支付完全不受影响
- WechatPayDialog 内部已有小程序 mp_openid 获取逻辑，只需确保不被外部传入的公众号 openid 覆盖
- 手机端/电脑端排版无任何变动

