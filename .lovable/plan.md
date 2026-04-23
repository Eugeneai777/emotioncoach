

## 问题定位：安卓微信浏览器「立即测评」第二次点击无反应

### 根因
`src/pages/WealthBlockAssessment.tsx` 中 `openWealthPayDialog()` 的强制重建逻辑（bump key + 先关后开）**只在小程序环境（`if (isMiniProgram)`）下完整执行**。安卓微信浏览器（`isWeChatBrowserEnv && !isMiniProgram`）走的是普通分支，所以：

1. 第一次点击 → 弹窗正常打开 → 跳到微信收银台
2. 用户用「返回」按钮回到本页，安卓 WebView 的 bfcache 把整页（含 `showPayDialog=true`、`createOrderCalledRef.current=true`）原样还原
3. 再点「立即测评」→ `setShowPayDialog(true)` 因状态已是 `true` 不触发 re-render → 弹窗内部 ref 保留 → **不重建订单、看似没反应**

iOS 微信浏览器表现不同是因为 iOS WKWebView 对 bfcache 处理更激进，多数情况会重新挂载组件。安卓微信内核（X5/TBS）则倾向完整恢复。

### 修复方案

**文件**：`src/pages/WealthBlockAssessment.tsx`

把现有 `if (isMiniProgram) { ... bump + reset signal ... }` 内的「强制重建」逻辑**扩展到所有微信环境（含安卓微信浏览器）**：

```text
openWealthPayDialog():
  清理 dismissed / resume-guard / pay_auth_in_progress
  
  if (isMiniProgram):
    清理 MP_PENDING_PAYMENT_STORAGE_KEY / MP_POST_CANCEL_FLAG_KEY
    bump miniProgramPayReturnSignal
  
  # 🆕 安卓微信浏览器也需要硬重建（bfcache 还原会卡住按钮）
  payDialogInstanceKey += 1        # 强制 unmount
  setShowPayDialog(false)
  requestAnimationFrame:
    setShowPayDialog(true)         # 下一帧重新挂载
```

当前代码的 `setPayDialogInstanceKey + setShowPayDialog(false→true)` 已经写在 `if` 之外（看似全平台生效），但实测在安卓微信里 `requestAnimationFrame` 在 bfcache 还原页面时可能被立即合批，没有真正触发 unmount。增加两道保险：

1. **使用 `setTimeout(..., 0)` 替代 `requestAnimationFrame`**，确保跨 React tick 重新挂载
2. **bfcache 还原时主动重置弹窗**：新增 `pageshow` 监听，若 `event.persisted === true` 且当前 `showPayDialog === true`，主动调用 `setShowPayDialog(false)`，让用户下次点击时一定走完整开/关循环

### 兼容性
- iOS 微信浏览器：已可用，`setTimeout(0)` 与 `requestAnimationFrame` 等价，不影响
- 微信小程序 WebView：原有 MP 专属重置逻辑保留，不受影响
- 桌面浏览器 / 普通手机浏览器：行为不变（无 bfcache 还原冲突）
- 不影响支付主链路、不影响订单、不影响计费

### 涉及文件
- `src/pages/WealthBlockAssessment.tsx`（仅 `openWealthPayDialog` + 新增 `pageshow` 监听）

### 不涉及
- `AssessmentPayDialog.tsx`、订单接口、edge function、微信支付回调
- 其他测评页面（情绪健康、SCL90 等）

### 验收
1. 安卓微信浏览器打开 `/wealth-block` → 点「立即测评」→ 弹窗打开 → 跳收银台
2. 点收银台「返回」按钮回到本页 → 再点「立即测评」→ 弹窗**重新打开并创建新订单**
3. 连续点击 3-5 次都能正常触发
4. iOS 微信浏览器、微信小程序、桌面浏览器行为完全不变
5. 控制台 `payment_button_clicked` 埋点每次点击都能落库

