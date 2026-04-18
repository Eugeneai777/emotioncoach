
## 确认执行范围（基于上轮已审计的现状）

红框 = `WealthBlockAssessment.tsx` 售前页底部「登录后可保存测评结果」引导卡片（含「去登录 / 先做测评」两个按钮）。

## 改动清单（2 处，最小侵入）

### 1. `src/pages/WealthBlockAssessment.tsx` — 删除红框卡片
- 移除底部「登录引导卡片」整块 JSX
- 主卡片「立即测评 ¥9.9」+「已有账号？点击登录」链接保留不动

### 2. 「立即测评」按钮 — 补全「登录回跳后自动拉付费弹窗」
- **未登录**：`sessionStorage.setItem('wealth_block_pending_pay', '1')` + `navigate('/auth?redirect=/wealth-block')`
- **已登录未付**：`setShowPayDialog(true)`（上一轮已实现，保留）
- **已付费**：`setShowIntro(false)` 进答题（保留）
- 页面 `useEffect` 内：检测 `user && hasPurchased=false && wealth_block_pending_pay==='1'` → 清除标记 → 自动 `setShowPayDialog(true)`，实现登录回跳无缝续付费

## 兼容性 / 不影响范围

- ✅ 已购买用户：`hasPurchased=true` 直接进答题，零变化
- ✅ 主 CTA 按钮、价格卡、四宫格诊断、海报分享、AI 解说、支付链路：全部不动
- ✅ 微信支付授权回跳（`assessment_pay_resume`）链路：不动
- ✅ 路由 `/wealth-block` 不变，外部分享链接（含 `?ref=`）不受影响
- ✅ PC（1157px+）/ 微信内 / H5 移动三端：仅删除一块静态卡片 + 增加一段 sessionStorage 续跑逻辑，排版和跳转无影响
- ✅ 其他 4 个付费测评（情绪健康 / 中场觉醒 / 35+女性 / SCL-90）：不动

## 风险评估

🟢 低风险：纯前端 UI 删除 + 一段 sessionStorage 续跑逻辑，无后端 / 无引擎层 / 无支付链路改动。
