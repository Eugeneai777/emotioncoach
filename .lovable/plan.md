
问题已基本定位，且和你描述的 iOS 微信小程序现象一致：第一次能拉起，取消后再次点击“立即测评”一直加载，本质上不是单纯前端弹窗没开，而是“小程序二次支付恢复链路”在复用旧订单/旧支付参数时卡住了。

我这次读到的关键信息：
1. 财富卡点测评页在小程序支付取消回跳后，会保留当前 pending 订单缓存并重新打开 `AssessmentPayDialog`。
2. `AssessmentPayDialog` 小程序二次点击“重新拉起支付”时，前端会优先复用缓存的 `mpPayParams`，缓存有效期是 4 分钟。
3. `create-wechat-order` 后端会复用同用户同套餐 5 分钟内的 pending 订单，并继续用旧 `orderNo` 向微信取新的 prepay_id。
4. 前后端的“复用窗口”不一致：前端 4 分钟，后端 5 分钟；再叠加 iOS 小程序回流慢、WebView 恢复慢，容易出现：
   - 前端还在等/还在恢复旧单
   - 后端继续复用接近过期的 pending 单
   - 用户侧看到就是二次点击后一直 loading，或者反复落在失效订单上

另外，我能读到当前代码，但这次会话里的前端 console/network 快照里没有匹配到相关请求，所以“刚才支付日志”无法直接从快照还原；不过从现有实现能看出问题点已经足够明确。

我建议按最小风险方案修：

1. 前端：小程序取消支付回跳后，不再直接把弹窗恢复到“继续复用旧单”的状态  
   - 在 `WealthBlockAssessment.tsx` 的 `payment_fail=1` 回跳处理中，保留“可重新支付”的 UI，但要显式标记“旧单不可直接继续自动恢复”。
   - 避免页面一打开就再次走旧缓存恢复，减少 iOS 回流后直接卡在 loading。

2. 前端：统一小程序二次支付策略  
   - 在 `AssessmentPayDialog.tsx` 中，把“重新拉起支付”分成两种情况：
     - 若缓存参数非常新鲜，才允许直拉
     - 只要是取消支付后返回，优先走“清旧缓存 + 重建订单”
   - 也就是把现在偏“复用旧单”的策略，改成更偏“取消后新建单”的策略，尤其针对 iOS 小程序。

3. 前端：修正恢复状态机，防止停留在 `idle/creating` 但没有再次触发下单  
   - 检查 `status/openIdResolved/createOrderCalledRef` 的组合。
   - 确保一旦用户点击“重新支付”，一定会重新触发 `createOrder()`，不会因为旧 ref 或旧 signal 残留而只显示 loading。

4. 后端：收紧小程序 pending 订单复用条件  
   - 在 `create-wechat-order` 中，对 `payType === 'miniprogram'` 的 pending 单复用增加更严格限制：
     - 缩短可复用窗口
     - 或者对“小程序取消后重试”直接不复用旧单，强制生成新 `orderNo`
   - 这样能彻底规避旧 prepay_id / 旧 out_trade_no 被 iOS 回流再次命中的问题。

5. 后端：补充日志字段，方便下次直接查到  
   - 给 `create-wechat-order` / `check-order-status` / `cancel-pending-order` 增加更明确日志：
     - packageKey
     - payType
     - orderNo
     - 是否复用旧单
     - 旧单创建时间/是否超近过期
     - 是否来自小程序二次重试
   - 这样下次你再说“检查刚才支付日志”，就能直接判断到底是“复用了旧单”还是“前端根本没重新下单”。

实施范围：
- `src/pages/WealthBlockAssessment.tsx`
- `src/components/wealth-block/AssessmentPayDialog.tsx`
- `supabase/functions/create-wechat-order/index.ts`
- 视情况补少量只读日志增强到 `check-order-status` / `cancel-pending-order`

预期结果：
- iOS 微信小程序里，第一次取消支付后，再次点击“立即测评”不会一直 loading
- 二次支付优先创建新订单或只复用足够新鲜的订单
- 不影响安卓/公众号/H5/扫码支付现有逻辑

我建议下一步直接按这个最小修复方案落地。
