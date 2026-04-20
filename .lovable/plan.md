

## /wealth-block 当前支付逻辑全景排查

### 文件清单
- `src/pages/WealthBlockAssessment.tsx` — 主页面，控制 showIntro / 守门 / 支付回调
- `src/components/wealth-block/AssessmentIntroCard.tsx` — 售前页 + 立即测评按钮（守门入口）
- `src/components/wealth-block/AssessmentPayDialog.tsx` — 财富卡点专用支付弹窗
- `src/components/WechatPayDialog.tsx` — 通用微信支付弹窗（被复用）
- `supabase/functions/create-wechat-order/index.ts` — 后端下单边缘函数

### 排查目标
1. 售前页 → 立即测评按钮的 4 种用户状态分支（未登录 / 已登录未付 / 已登录已付 / 绽放合伙人）
2. 支付环境路由（PC 浏览器 / PC 微信 / 手机微信内 / 手机外部浏览器 / 小程序 WebView）→ 实际触发的下单 payType（native / jsapi / mp）
3. sessionStorage 中支付续跑相关 key（`MP_PENDING_ORDER_STORAGE_KEY`、`wealth_block_pending_pay`、`assessment_pay_resume`）的写入/清除时机
4. 支付回调链路：`usePaymentCallback` → URL hash → `setShowIntro(false)` 进答题
5. 微信 OAuth 授权回跳（`assessment_pay_resume=1`）的恢复链路
6. 后端订单幂等复用规则（line 89–155 / 296）：何时复用 `existingOrderNo`，何时生成新单
7. **跨支付通道复用风险点**：PC 起 native 单 → 手机微信续付 jsapi 时是否会触发微信 `INVALID_REQUEST`

### 排查方法（只读）
- `code--view` 4 个前端文件 + 1 个边缘函数关键段
- `supabase--read_query` 抽样查最近 24h 该用户的 orders 表（pay_type 分布、status、复用情况）
- `supabase--edge_function_logs` create-wechat-order 最近错误日志
- 不动任何代码

### 产出
排查完成后，输出**纯文字诊断报告**，包含：
- 5 端环境 × 4 用户状态 = 20 个分支的实际行为表
- 已发现的 bug / 风险点（含日志证据）
- 不影响业务前提下的可选优化建议（仅列举，不实施）

待您审阅报告后，再决定是否进入具体修复方案。

