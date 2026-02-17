

## 问题诊断

截图显示：在微信小程序中，财富卡点测评支付弹窗卡在加载动画（spinner），无法进入支付流程。

### 根本原因

在小程序 WebView 环境下，代码陷入了**无限循环**：

1. 弹窗打开 → `status = "idle"`
2. `fetchUserOpenId` 执行 → 小程序中没有 `mp_openid`（URL 和 sessionStorage 都没有） → 设置 `openIdResolved = true`
3. useEffect 触发 `createOrder()`
4. `createOrder()` 检测到是小程序且 `!userOpenId` → 调用 `requestMiniProgramOpenId()`（postMessage 不会实时回复）→ **重置 `status = "idle"`** → return
5. useEffect 再次触发（因为 `status` 又变回 `idle`）→ 回到步骤 3

结果：弹窗永远显示 spinner，无法进入支付。

### 关键代码位置

```text
// 第 476-481 行：死循环的根源
if (!userOpenId) {
  requestMiniProgramOpenId();   // postMessage 不会实时返回
  setStatus("idle");            // 重置状态 → 触发 useEffect 重新调用
  return;                       // 永远不会继续
}
```

## 修复方案

在小程序环境中，当无法获取 `mp_openid` 时，**降级为扫码支付（native QR code）** 而不是无限循环等待。

### 修改文件

**`src/components/wealth-block/AssessmentPayDialog.tsx`**

修改 `createOrder` 中小程序分支的逻辑（第 471-481 行）：

```typescript
if (isMiniProgram) {
  console.log("[Payment] MiniProgram detected, openId:", userOpenId ? "present" : "missing");

  if (!userOpenId) {
    // 无法获取 mp_openid，降级为扫码支付
    console.warn("[Payment] MiniProgram: no mp_openid, falling back to native QR");
    selectedPayType = "native";
  } else {
    selectedPayType = "miniprogram";
  }
}
```

这样当小程序中没有 openId 时，会生成微信扫码二维码让用户完成支付，而不是无限等待。

