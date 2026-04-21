

# /wealth-block 微信支付链路自检方案

## 检测目标
对刚改完的「openId 反查仅在 guest 时生效」+「账号冲突轻提示」做静态自检，找出回归风险点，不在浏览器里跑（生产数据 + 真实支付，跑了会产生脏订单）。

## 自检范围（只读分析）

### 1. 前端 `WealthBlockAssessment.tsx`
- 新增 `conflictDialog` 状态与 `AlertDialog` 是否在所有分支正确关闭
- `handlePayClick` 三种用户态（未登录 / 已登录已购 / 已登录未购）走向是否都覆盖了冲突检测
- 切换账号路径：`signOut` 后 `triggerWeChatSilentAuth` 的 redirect 是否带 `assessment_pay_resume=1`
- "继续付款" 路径是否能正确把 `userId = currentUser.id`（乙）传进 `AssessmentPayDialog`

### 2. `AssessmentPayDialog.tsx`
- 调 `create-wechat-order` 的 `userId` 字段值确认（必须是 `useAuth().user.id`，不是 openId 反查值）
- 微信内 PC 浏览器误判（UA 含 `MicroMessenger` 但桌面环境）→ 是否仍走 jsapi 死循环
- 取消支付后 `MP_POST_CANCEL_FLAG_KEY` 写入是否影响 H5 浏览器场景

### 3. 后端 `create-wechat-order/index.ts`
- 确认 `userId !== 'guest'` 时**完全跳过** openId→system_user_id 反查
- 确认 `userId === 'guest'` 时反查链路保留（"先付款后登录"不能炸）
- 确认 `orders.user_id` 写入字段值就是入参 `userId`，没有被中途覆盖

### 4. 后端 `wechat-pay-callback/index.ts`
- 确认支付成功回写 `orders.status='paid'` 时**不会**再次根据 openId 重新覆盖 `user_id`
- 确认 `user_camp_purchases` 自愈逻辑用的是订单上的 `user_id`（即乙），不是 openId 反查

### 5. 数据库静态校验（只读 SQL）
- 查近 7 天 `orders` 表中 `package_key='wealth_block_assessment'` 的记录，确认 `user_id` 与下单人手机号一致
- 查 `wechat_user_mappings` 中是否存在「一个 openid 绑定多个 system_user_id」的边界数据
- 查 `useAssessmentPurchase` 的查询条件能否被 RLS 正确放行（`user_id = auth.uid()`）

### 6. 已知风险点重点排查
| 风险 | 排查方法 |
|---|---|
| 切账号后回跳缺 `payment_token_hash` 导致登录失败 | 看 `wechat-pay-auth` 是否对未绑定 openid 的 flow 也下发 magic link |
| 冲突弹窗在「网络慢 + openId 还没缓存」时漏触发 | 检查 `getPaymentOpenId` 的同步/异步获取顺序 |
| AlertDialog 与 PayDialog 同时存在的 z-index / focus 冲突 | 看 `setShowConflict(false)` 后是否立刻 `setShowPayDialog(true)` |
| guest 支付后用户登录乙，account_merging 是否仍能合并 | 看 `merge-temp-account` 是否仍按 openid 维度寻找 temp 订单 |

## 输出形式
按上述 6 节出一份「✅ 已确认安全 / ⚠️ 需关注 / ❌ 发现 bug」清单。
- ✅ 项：直接列结论
- ⚠️ 项：说明潜在条件 + 触发路径，但不强制改
- ❌ 项：定位文件 + 行号 + 修复建议（你确认后再改）

## 不做
- **不在浏览器里点支付**（会产生真实订单）
- 不动数据库（只 SELECT）
- 不调 `create-wechat-order` 真实下单测试
- 不改任何代码（仅出清单）

