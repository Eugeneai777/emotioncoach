

# 预扣费失败时显示横幅而非报错关闭

## 问题分析

用户点击语音教练后，系统在连接前执行**预扣费**（第1分钟）。当余额为0时：

1. `deductQuota(1)` 调用 → HTTP 400 → `deductQuotaWithRetry` 正确返回 `{ success: false, isNetworkError: false }`
2. `deductQuota` 内部正确设置了 `setInsufficientDuringCall(true)`（L548-550）
3. **但是**，调用方（L1243-1249）检查到 `!deducted` 后立即执行：
   - `setStatus('error')` → 页面显示"连接失败"
   - `setTimeout(onClose, 1500)` → 1.5秒后关闭页面

所以横幅虽然被触发，但页面立刻被关闭了，用户看到的是错误状态 + 自动关闭。

## 修复方案

**仅修改 `src/components/coach/CoachVoiceChat.tsx` 中 L1243-1249 的预扣费失败分支**

将当前逻辑：
```typescript
if (!deducted) {
  setStatus('error');
  isInitializingRef.current = false;
  stopConnectionTimer();
  releaseLock();
  setTimeout(onClose, 1500);
  return;
}
```

改为：**区分余额不足和其他扣费失败**
```typescript
if (!deducted) {
  isInitializingRef.current = false;
  stopConnectionTimer();
  releaseLock();
  
  if (insufficientDuringCall) {
    // 余额不足：保持页面打开，显示横幅引导充值
    setStatus('idle');
    return;
  }
  
  // 其他扣费失败（网络等）：保持原有逻辑
  setStatus('error');
  setTimeout(onClose, 1500);
  return;
}
```

由于 `insufficientDuringCall` 是 state，可能在同一 tick 还未更新。需要改用同步判断：让 `deductQuota` 返回更详细的信息，或者直接用 `deductQuotaWithRetry` 的返回值判断。

实际实现：
```typescript
// 改用 deductQuotaWithRetry 直接获取结果
const preDeductResult = await deductQuotaWithRetry(1);
if (!preDeductResult.success) {
  isInitializingRef.current = false;
  stopConnectionTimer();
  releaseLock();
  
  if (!preDeductResult.isNetworkError) {
    // 余额不足：设置横幅，保持页面
    setInsufficientDuringCall(true);
    setStatus('idle');
  } else {
    setStatus('error');
    setTimeout(onClose, 1500);
  }
  return;
}
// 预扣成功，更新 lastBilledMinuteRef
lastBilledMinuteRef.current = 1;
```

### 改动范围
- **仅修改** `src/components/coach/CoachVoiceChat.tsx`
- L1230-1249 区域：将 `deductQuota(1)` 替换为 `deductQuotaWithRetry(1)` 并根据返回结果区分处理
- 不修改 `deductQuotaWithRetry` / `deductQuota` 函数本身
- 不修改横幅 UI、边缘函数、路由等

