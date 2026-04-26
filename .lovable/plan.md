## 修复目标

解决 `/wealth-block` 财富卡点测评在微信授权后偶发卡住的问题：授权回跳后应稳定恢复登录态、缓存 openId，并自动继续拉起支付弹框/JSAPI 支付；如果授权或登录恢复异常，前台给出正确进度提示并允许用户无感重试。

## 已定位的问题

当前日志显示：

- `/wealth-block?ref=share` 触发了 `wechat_auth_triggered`，但部分链路后续没有出现 `payment_submitted` / `payment_order_created` / `payment_jsapi_invoking`。
- 授权回跳期间有 `/user` 500 `context canceled`，同时存在 session 短暂丢失/恢复。
- `WealthBlockAssessment.tsx` 的授权回跳处理 effect 只在组件首次挂载执行一次，并闭包捕获了初始的 `hasPurchased/user` 状态；在微信 iOS/Android 回跳、session 异步恢复、页面复用/bfcache 场景下，可能错过继续支付。
- `PayEntry.tsx` 已有 8 秒兜底，但 `run()` 成功后没有主动清理兜底 timer，可能导致重复/乱序回跳。

## 实施方案

1. **加固 `/wealth-block` 授权回跳恢复**
   - 增加 `paymentAuthReturnHandledRef` 防止重复处理同一次回跳。
   - 回跳后先缓存 `payment_openid` 到支付组件使用的统一 key。
   - 不依赖初始闭包里的 `hasPurchased/user`，改为实时读取当前 session，并在必要时等待短时间的 auth 状态恢复。
   - `verifyOtp(token_hash)` 成功后，先权威查询订单是否已支付；未支付才打开支付弹框。
   - 授权失败或登录恢复失败时，清除 `pay_auth_in_progress`，回落到重新打开支付弹框，避免停在“正在授权”。

2. **修复 PayEntry 授权回调兜底 timer**
   - `wechat-pay-auth` 换码成功或失败并准备 `window.location.replace()` 前，清理 8 秒 fallback timer。
   - 避免用户已经成功回跳业务页后，旧 timer 又触发一次 fallback 回跳，造成重复打开弹框或状态覆盖。

3. **补充支付流程埋点**
   - 在财富测评授权回跳关键节点记录事件：
     - 授权回跳开始
     - openId 已缓存
     - tokenHash 登录成功/失败
     - 恢复支付弹框
     - 恢复跳过：用户已购买
   - 便于后续从 `payment_flow_events` 判断是否仍有卡住链路。

4. **正确提示进度**
   - 保留现有“正在完成微信授权/正在处理”的体验。
   - `/wealth-block` 回跳恢复期间如需要等待 session，同步设置授权中状态，避免用户看到按钮无反应。
   - 出错时不展示“系统不稳定/重试”字样，改为“正在继续打开支付，请稍候”或直接恢复支付弹框。

5. **验证**
   - TypeScript 类型检查。
   - 检查 `/wealth-block?ref=share`、普通 `/wealth-block` 两条授权回跳路径：
     - 授权触发后回跳带 `payment_openid/payment_token_hash/payment_resume/assessment_pay_resume`。
     - 自动登录后创建订单并进入 `payment_jsapi_invoking`。
     - 若用户已购买，则不再重复拉起支付，直接进入测评。

## 涉及文件

- `src/pages/WealthBlockAssessment.tsx`
- `src/pages/PayEntry.tsx`

不改变财富卡点测评的业务逻辑、价格、购买权益判断或订单履约逻辑，只修复授权恢复与支付继续流程。