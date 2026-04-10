

# 修改情绪教练余额不足处理逻辑

## 问题分析

用户 `13548060283` 的 `remaining_quota = 0`。当前逻辑在进入语音通话前立即检查余额，余额不足直接弹出 365 付费弹窗（`UnifiedPayDialog`），导致用户无法进入通话。

## 用户期望的行为

1. **进入通话**：不管余额多少，直接开始通话（有 10 分钟免费体验时长，由 `get_voice_max_duration` RPC 控制）
2. **余额不足时**：在通话界面**顶部显示文字提醒横幅**："余额不足，继续请前往365会员页面充值"，旁边一个绿色按钮"前往充值"
3. **点击按钮**：导航到 `/packages` 产品中心页面，**不弹出** `UnifiedPayDialog`

## 修改方案

### 文件：`src/components/coach/CoachVoiceChat.tsx`

#### 1. 修改初始化逻辑（~第1930-1943行）
- 当 `checkQuota()` 返回 `'show_pay'` 时，**不再弹出支付弹窗**，改为直接调用 `startCall()` 开始通话
- 删除或不触发 `setShowPayDialog(true)`

#### 2. 修改通话中余额不足的 UI（~第2028-2078行）
- 将 `insufficientDuringCall` 状态的 UI 从**全屏支付弹窗**改为**顶部横幅提醒**
- 不再渲染 `UnifiedPayDialog`
- 显示文字："余额不足，继续请前往365会员页面充值"
- 旁边绿色按钮"前往充值"，点击后 `navigate('/packages')` 并调用 `endCall()`

#### 3. 修改每分钟扣费失败处理（~第1774-1787行）
- 余额不足时仍然设置 `setInsufficientDuringCall(true)`，但不再断开通话
- 改为在通话界面顶部显示提醒横幅，通话继续到 10 分钟时长限制自动结束

#### 4. 删除 `showPayDialog` 相关的全屏 UI（~第1971-2000行）
- 删除初始化时的支付弹窗渲染逻辑

### 不改的
- 不改 `UnifiedPayDialog` 组件本身
- 不改 edge function、数据库
- 不改 `skipBilling` 逻辑
- 不改 `maxDurationMinutes` 时长限制逻辑
- 不改其他页面

### 效果
所有用户进入语音教练 → 直接开始通话 → 余额不足时顶部横幅提醒 → 点击"前往充值"跳转到 `/packages` → 10 分钟到达后自动结束通话

