

## 问题分析与修复方案

### 问题 1：登录返回后未恢复到结果页 + 未自动弹出支付弹窗

**根因**：`WealthAssessmentFree.tsx` 的 `useEffect` 检测到 `isPayResume` 后只打了 log（"will auto-trigger pay dialog"），但从未将信号传递给子组件 `WealthBlockResult` 来自动打开 `showPayDialog`。结果页虽然从 sessionStorage 恢复了，但支付弹窗没有自动弹出，用户需要再次点击购买按钮。

**修复方案**：

**文件：`src/pages/WealthAssessmentFree.tsx`**
- 新增 state `autoOpenPay`，在 `isPayResume` 检测到时设为 `true`
- 将 `autoOpenPay` 作为 prop 传递给 `WealthBlockResult`

**文件：`src/components/wealth-block/WealthBlockResult.tsx`**
- 新增 prop `autoOpenPay?: boolean`
- 添加 `useEffect`：当 `autoOpenPay` 为 `true` 时，自动设置 `showPayDialog = true`（仅在未购买时）

### 问题 2：微信浏览器首次支付 OAuth 授权返回后未自动拉起支付

**根因**：在微信浏览器中，首次打开支付弹窗时没有 `openId`，触发静默授权重定向。OAuth 回跳后页面完全重新加载：
1. `WealthBlockResult` 重新挂载，`showPayDialog` 初始为 `false`
2. 即使问题 1 修复后 `showPayDialog` 能自动设为 `true`，`WechatPayDialog` 也能正确流转
3. 但 `exchangeCodeForOpenId`（line 347）会从 URL 中删除 `payment_resume` 参数，这可能导致父组件的恢复逻辑出现竞态

**实际上**，问题 2 是问题 1 的延伸——OAuth 返回后支付弹窗没有被自动打开，所以 `createOrder` 不会被调用。修复问题 1 后，OAuth 返回 → 恢复结果页 → 自动打开支付弹窗 → `fetchUserOpenId` 从 URL/缓存获取 openId → `openIdResolved = true` → `createOrder` 自动执行 → 支付正常拉起。

**额外保险**：确保 `exchangeCodeForOpenId` 删除 URL 参数不会影响父组件的 `isPayResume` 检测，因为父组件优先检查 `sessionStorage`（`SS_KEY_PAY_RESUME`），不依赖 URL 参数。

### 修改文件清单

| 文件 | 改动 |
|------|------|
| `src/pages/WealthAssessmentFree.tsx` | 新增 `autoOpenPay` state，在 `isPayResume` 时设为 `true`，传递给 `WealthBlockResult` |
| `src/components/wealth-block/WealthBlockResult.tsx` | 新增 `autoOpenPay` prop，`useEffect` 自动打开支付弹窗 |

### 不影响项
- 现有测评答题流程、结果计算逻辑不变
- 支付组件（UnifiedPayDialog / WechatPayDialog）内部逻辑不变
- sessionStorage 缓存/恢复机制不变
- 其他页面的支付流程不变
- 路由结构不变

