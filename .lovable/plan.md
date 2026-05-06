## 目标

将"情绪健康测评"（`emotion_health_assessment`）从 ¥9.9 付费改为**完全免费**，所有用户（含未购买）都可以直接：开始 → 答题 → 查看完整结果页。其他逻辑（AI 洞察、分享海报、历史记录、转化卡片等）**保持不变**。

## 改动范围（仅前端门控）

只在两个入口页面绕过付费弹窗，不动数据库 / 不动 packages 表 / 不动 edge function / 不动 `useEmotionHealthPurchase`（其他模块如 LaogeAI、合伙人佣金、体验包等仍依赖 orders 记录，所以保留 hook 行为）。

### 1. `src/pages/EmotionHealthPage.tsx`
- 在 `hasPurchased` 计算处改为：`const hasPurchased = true;` （或新增常量 `const FREE_MODE = true;` 后用 `const hasPurchased = FREE_MODE || !!purchaseRecord;`）
- 移除/跳过 `assessment_pay_resume` 自动拉起付费弹窗的逻辑（因为不再需要恢复付费）
- `handlePayClick` 不再被触发（因为 `hasPurchased=true`），但保留函数避免大改
- 保留 `AssessmentPayDialog` 组件挂载但 `open` 永远为 false

### 2. `src/pages/EmotionHealthLite.tsx`
- 同样把 `hasPurchased` 视为 true，`handleComplete` 直接跳到 `result`，不再触发 `setShowPayDialog(true)`
- `showFooterInfo={!hasPurchased}` 等付费引导条隐藏（与"免费"一致）

## 不改动

- 数据库 `packages` 表中 `emotion_health_assessment` 的价格记录（保留历史订单/统计真实性）
- `useEmotionHealthPurchase` hook（其他业务逻辑仍可正确读取真实订单状态）
- 结果页、AI 教练、分享海报、历史 Tab、转化推荐卡片
- 7天训练营 ¥399 / 婚姻测评 等其他付费产品

## 验收

- 未登录/未购买用户进入 `/emotion-health` 或 `/emotion-health-lite`，答完题立刻看到完整结果页，不弹付费弹窗
- 历史记录、分享海报正常工作
- 其他付费测评（婚姻、SCL90、财富）不受影响