

## 优化方案：进入语音教练页后再显示余额不足横幅 + 4档充值弹窗

### 现状（问题复现）

用户 `15828356318` 在 `/mama` 点「女性AI语音教练」时：
- `CoachVoiceChat` 组件挂载 → 预检额度 `quotaResult === 'show_pay'`（余额 < 8 点）
- 立即进入 `showPayDialog` 分支 → 全屏渲染 `UnifiedPayDialog`，硬编码 `MEMBER_365_PACKAGE`（仅 365 会员一种）
- 用户**根本没看到语音教练页面**，体验断裂；且只有 365 会员一档，无法选 ¥9.9 / ¥49.9 / ¥99 套餐

而通话过程中余额耗尽走的是另一条路径（`insufficientDuringCall` 横幅 + 上一轮已上线的 `QuotaRechargeDialog` 4 档弹窗），体验良好。**两条路径不一致**。

### 优化目标

**统一入口前与通话中两种"余额不足"体验**：进入语音教练页后，先正常加载页面，顶部弹出「余额不足，继续请前往充值」红色横幅，点「前往充值」打开 `QuotaRechargeDialog`（4 档套餐）。不影响其它任何逻辑。

### 实施

**只改 1 个文件：`src/components/coach/CoachVoiceChat.tsx`**

1. **删除 `showPayDialog` 全屏分支**（约 1971-2001 行的 `if (showPayDialog) return (...)`）— 不再以独立全屏挡板呈现；同时移除 `MEMBER_365_PACKAGE` 常量（已不再使用）。

2. **`init()` 内 `quotaResult === 'show_pay'` 改为**：
   ```ts
   if (quotaResult === 'show_pay') {
     // 进入页面但不发起通话，直接显示横幅引导充值
     setInsufficientDuringCall(true);
     setStatus('idle');
     setIsCheckingQuota(false);
   }
   ```
   这样组件会落到主 return（2036 行起），用户看到的是完整的语音教练界面 + 顶部红色横幅。

3. **横幅按钮逻辑不动**（已是 `setShowRechargeDialog(true)` → 打开 `QuotaRechargeDialog` 4 档套餐），无需改动。

4. **`QuotaRechargeDialog` `onSuccess` 增强**：充值成功且这是"入口前余额不足"场景时，自动调用 `startCall()` 让用户无缝开始通话（沿用上一轮已写好的余额刷新逻辑，仅在 `remainingQuota >= POINTS_PER_MINUTE` 且当前 `status === 'idle'` 时追加 `startCall()`）。

5. **保留 `showPayDialog` state 与 `setShowPayDialog` setter**（避免破坏其它引用），但永不置为 `true`；或一并删除，由 lsp 检查决定。优先采用一并删除的纯净方案。

### 行为对比

| 场景 | 改造前 | 改造后 |
|---|---|---|
| 余额 < 8 点 进入语音教练 | 全屏弹 365 会员二维码，看不到教练页 | 进入教练页 + 顶部横幅，点击展开 4 档充值 |
| 余额充足 进入语音教练 | 正常通话 | 不变 |
| 通话中余额耗尽 | 横幅 + 4 档充值（上一轮已优化）| 不变 |
| 充值成功 | 关弹窗 → 重新进入即可开播 | 关弹窗 → 自动开始通话 |
| 关闭充值弹窗（不付） | — | 横幅保留，可挂断返回或再次充值 |

### 影响面（确认安全）

- ✅ 5 个 AI 教练（女性 / 职场 / 大劲 / 小劲 / 我们 AI）共用 `CoachVoiceChat`，一次改动全部生效，全部统一为 4 档体验
- ✅ 不动 `useVoiceBilling` / `deductQuotaWithRetry` / `get_voice_max_duration` RPC / 计费扣点逻辑
- ✅ 不动训练营 `skipBilling` 路径（前端 `checkQuota` 直接 `return true`）
- ✅ 不动 `XiaojinVoice` 的 `PurchaseOnboardingDialog` 流程（独立组件）
- ✅ `QuotaRechargeDialog` 已上线稳定，套餐数据来自 `usePackages`，无需数据库改动
- ✅ 取消支付时用户可正常退出页面，不会卡死

### 改动文件

| 类型 | 路径 | 改动 |
|---|---|---|
| 前端 | `src/components/coach/CoachVoiceChat.tsx` | 删除 `showPayDialog` 全屏分支与 `MEMBER_365_PACKAGE`；`show_pay` 改为设置横幅 + 留在页面；`onSuccess` 追加自动开播 |

### 工时

0.2 天（核心改动 + 5 教练入口回归 + 「入口前 / 通话中 / 余额恢复后」三态测试）

