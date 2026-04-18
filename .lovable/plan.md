
## 决策确认
- **35+女性竞争力**：方案 X1（独立页面 `WomenCompetitiveness.tsx` 内付费墙，不动通用引擎）
- **SCL-90**：付费墙前置，与情绪健康对齐

## 改动清单（5 处）

### 1. `src/pages/WealthBlockAssessment.tsx`
- `AssessmentIntroCard onStart` 回调内：未登录 → 跳 `/auth`；已登录未付 → 拉 `setShowPayDialog(true)`；已付才 `setShowIntro(false)` 进答题
- 复用页面已有的 `hasPurchased` / `setShowPayDialog` / 微信支付授权回跳

### 2. `src/pages/MidlifeAwakeningPage.tsx`
- `handleStart` 内补 `if (!hasPurchased) { handlePayClick(); return; }`，登录检查保留

### 3. `src/pages/WomenCompetitiveness.tsx`（方案 X1）
- 新增 phase `'start'` 作为默认入口（替代当前直接 `'questions'`）
- 引入 `useDynamicAssessmentPurchase('women_competitiveness_assessment')` + `usePurchaseOnboarding` + `AssessmentPayDialog`
- 复用已有 `CompetitivenessStartScreen` 作为启动屏（已具备「开始测评 / 历史记录」按钮）
- `onStart` 回调：未登录跳 `/auth`；已登录未付拉付费弹窗；已付进 `'questions'`
- 历史记录入口、`handleViewHistoryReport`（已付费用户已有记录）保持不变
- sessionStorage 持久化测评中状态（OAuth/支付回跳后恢复），复用 `state-persistence-pattern`

### 4. `src/pages/SCL90Page.tsx`
- `handleStart` 改为：未登录跳登录；未付 `setPageState("payment")` 并清空 `pendingResult`（付费弹窗独立运行，不依赖答题结果）
- `SCL90PaymentGate` 调整为支持「答题前付费」模式：付费成功后 `setPageState("questions")` 而非直接出结果
- `handleComplete` 兜底逻辑保留（防御老用户答题中途付费迁移），但正常流程不再走「答完才付费」

### 5. 自测矩阵
- 5 个付费测评 × (未登录 / 已登录未付 / 已付) × (PC / 微信内 / H5 移动)
- 重点验证：微信支付授权回跳后能恢复到「正在答题」/「即将答题」状态
- 已购买老用户体验零变化（hasPurchased=true 直接放行）

## 不影响范围（明确不动）
- 通用引擎 `DynamicAssessmentPage`、计分逻辑、订单/支付链路
- Free / Lite 引流页（`/emotion-health-lite`、`/wealth-assessment-free` 等）
- 海报分享、AI 教练解说、训练营转化按钮的现有付费校验
- 已购买用户的所有现存数据与历史记录访问

## 兼容性
- PC（1157px+）/ 微信 WebView / H5 移动：复刻 `EmotionHealthPage` 同一套已三端验证的链路
- 排版：仅在「开始测评」按钮逻辑内做条件分支，UI 结构不变
- 路由：`/wealth-block`、`/midlife-awakening`、`/women-competitiveness`、`/scl90` 路径不变，外部分享链接不受影响
