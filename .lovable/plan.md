

## 问题 1：iOS 取消订单后没有 toast 提示

### 根本原因
取消提示有 **两个来源**，iOS 都被静默掉了：

1. **小程序原生支付页返回 H5（iOS 真实路径）**
   - iOS 取消支付时，微信小程序会通过 `failCallbackUrl` 回跳 H5 页面，URL 带 `?payment_fail=1`。
   - 触发 `WealthBlockAssessment.tsx:212` 的 `toast.info('支付已取消，可重新发起支付')`。
   - **但**：iOS WebView 在 `pageshow` 时序里，`searchParams` 解析、URL 清理、toast 容器挂载存在竞态。我们紧接着调用 `setShowPayDialog(false)` + `setPayDialogInstanceKey+1`，导致 React 同一 tick 内卸载/重挂多个组件，`<Toaster>` 的容器被瞬时切换，toast 被吞掉。
   - 安卓 WebView 不重挂 toaster，所以提示能正常出现。

2. **弹窗内 `handleDialogOpenChange` 关闭时（仅 H5 弹窗手动关）**
   - `AssessmentPayDialog.tsx:1313` `toast.info("订单已取消")`。
   - iOS 在小程序里走的是"原生支付页 → 回跳 H5"路径，弹窗是被 `forceCloseStaleMiniProgramDialog`（1322）关掉的，那条 toast `'已返回测评页...'` 也常被同 tick remount 吞掉。

### 修复方向
- 把 iOS 的取消 toast 延迟到下一帧（`requestAnimationFrame` + 100ms setTimeout）再触发，确保在 `payDialogInstanceKey` bump 后的 React commit 之后执行。
- 把 toast 文案统一为「支付已取消，可重新发起」，避免 `forceCloseStaleMiniProgramDialog` 与 `payment_fail=1` 路径重复弹两次。
- 加 `payment_cancelled` 事件落库（`logFlowEvent`），作为可观测兜底。

---

## 问题 2：取消支付后改了哪些状态？再次点击立即测评要过哪些判断？

### A. 取消时被重置的状态（前后端全清单）

**前端 sessionStorage（`WealthBlockAssessment.tsx:184-190`）**
```text
- MP_PENDING_PAYMENT_STORAGE_KEY      → 删除（旧 orderNo 缓存）
- MP_PENDING_PAYMENT_DISMISSED_KEY    → 删除
- MP_PENDING_PAYMENT_RESUME_GUARD_KEY → 删除
- MP_POST_CANCEL_FLAG_KEY             → 置为 '1'（禁止 auto-resume）
```

**前端 React state**
```text
- showPayDialog                       → false（弹窗关闭）
- miniProgramPayReturnSignal          → Date.now()（触发子组件 hard-reset effect）
```

**弹窗子组件（`AssessmentPayDialog.tsx:1326-1351`，由上面 signal 触发）**
```text
refs:  createOrderCalledRef / createOrderRetriedRef
       / mpNativePayLaunchedRef / mpNativePayPageHiddenRef → false
state: orderNo / mpPayParams / qrCodeDataUrl / payUrl    → 清空
       status                                              → 'idle'
poll:  stopPolling()（清 interval）
```

**后端（edge function）**
```text
cancel-pending-order:
  orders.status: 'pending' → 'cancelled'
  orders.updated_at: now()
```

### B. 再次点击「立即测评」要过的判断链

```text
点击立即测评
   │
   ▼
handlePayClick()  ── WealthBlockAssessment.tsx:319
   │
   ├─ 微信浏览器 + 未登录？ → 触发 silent OAuth → 回跳后再 openWealthPayDialog()
   │
   └─ 否 → openWealthPayDialog()
            │
            ├─ 清 MP_PENDING_PAYMENT_DISMISSED_KEY / RESUME_GUARD_KEY
            ├─ 是小程序？ → 清 STORAGE_KEY + POST_CANCEL_FLAG
            │              + bump miniProgramPayReturnSignal
            │              + bump payDialogInstanceKey（强制 remount）
            └─ setShowPayDialog(true)
                 │
                 ▼
           AssessmentPayDialog 挂载 / 重挂
                 │
                 ▼
           openId 等待判断（line 199-201）
              ├─ 小程序？      → shouldWaitForOpenId = false（不阻塞）
              └─ 微信浏览器？  → 必须等到 openId 才放行
                 │
                 ▼
           createOrder effect（line 1469）
              条件：open && status==='idle'
                  && !createOrderCalledRef.current
                  && (!shouldWaitForOpenId || openIdResolved)
                 │
                 ▼
           调用 supabase.functions.invoke('create-wechat-order'）
              body 关键字段：
                packageKey, amount, userId
                payType: miniprogram | jsapi | h5 | native
                openId（jsapi 必须）
                isMiniProgram: true
                forceNewOrder: true（小程序内永远 true）
                 │
                 ▼
           edge function 返回 orderNo + 支付参数
                 │
        ┌────────┴────────┐
        ▼                 ▼
  小程序：跳原生支付页    微信浏览器：等 Bridge → invokeJsapiPay
  （wx.miniProgram.       失败兜底 → native QR 扫码
   navigateTo）
                 │
                 ▼
   waitForNativePageTransition：监听 visibilitychange/pagehide/blur
        ├─ 检测到页面真的离开 → status='polling' 显示「支付中」
        └─ 2.6s 内没离开（iOS Bridge 假成功）→ status='mpLaunchFailed'，UI 仍可点击重试
```

### 关键卡点对照表

| 阶段 | 阻断条件 | 出现症状 |
|------|---------|---------|
| openWealthPayDialog | `isMiniProgram` 检测失败 → 不 bump key | 复用旧弹窗实例，旧 ref 残留 |
| openId 等待 | 微信浏览器 `openIdResolved=false` | 弹窗一直显示 loading |
| createOrder effect | `createOrderCalledRef=true`（未清） | effect 不执行，无网络请求 |
| edge function | `forceNewOrder=false` 且后端复用旧 prepay_id | 微信报"prepay_id 已用" |
| Bridge 调起 | iOS `wx.miniProgram.navigateTo` 假成功 | 显示"支付中"但实际没拉起 |

---

## 建议下一步行动

需要我做：
1. **修 iOS toast 不显示**：在 `payment_fail=1` 分支用 `setTimeout(() => toast.info(...), 120)` 包一层，避开 React remount 同 tick；同时去掉 `forceCloseStaleMiniProgramDialog` 里那条会重复的 toast。
2. **加可观测**：取消时落 `payment_cancelled` 事件到 `payment_flow_events`，方便后续核对 iOS/安卓行为是否一致。

确认后切回执行模式实施。

