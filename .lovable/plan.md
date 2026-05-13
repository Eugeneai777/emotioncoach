# 财富卡点测评 - 答题链路体验优化

> **执行原则**：本次仅做前端 UI/交互层优化，不改动评分算法、追问触发业务规则、Edge Function 业务逻辑、付款/路由。**任何会影响现有业务逻辑的改动会先列出由你确认后再执行。**

---

## 一、问题定位（已通过代码核查确认）

涉及文件：
- `src/components/wealth-block/WealthBlockQuestions.tsx`（答题主控）
- `src/components/wealth-block/FollowUpDialog.tsx`（单题AI追问）
- `src/components/wealth-block/DeepFollowUpDialog.tsx`（提交后深度追问）

### 问题1：选「太像我了」(5分) 卡顿 1.5–3 秒
- 选 5 分立即调用 `smart-question-followup` Edge Function（AI 生成 1.5–3s）
- 期间 FollowUpDialog 仅在卡片底部出现一行不显眼的 loading 文字
- 选项被 disabled、"下一题"按钮也被锁，**用户视觉上完全无反馈** → 误以为页面卡死

### 问题2：最后一题（第30题）卡住"没有下一步"
- `handleAnswer` 在最后一题既不触发追问也不自动跳转
- 必须手动滚动到底部点"查看结果"，**小屏 + 微信顶栏占位时按钮在视口外**
- 点击后进入 `generate-deep-followup`，最长等 15s，期间紫色 loading 卡只有静态文案

### 问题3：多端兼容隐患
- 错误路径若不清 `pendingNextQuestion`，按钮可能永久 disabled
- Android 微信 WebView 上 motion 转场掉帧

---

## 二、优化方案（纯 UI/交互，不影响业务）

### A. 即时反馈层（解决"5分卡顿"）

**用户场景**：李姐选「太像我了」→ **100ms 内**屏幕自动平滑滚动，下方立即出现一张追问卡片骨架：

```text
┌──────────────────────────────────┐
│ 💬 想多了解一点      [跳过 ✕]    │
│ ──────────────────────────────── │
│ 你刚才选择了「太像我了」5分      │
│                                  │
│ ✨ AI 正在为你生成追问…          │
│ ░░░░░░  ░░░░░  ░░░░░░░           │  ← 灰色占位 chip
│ ░░░░░░  ░░░░░░░░░                │
└──────────────────────────────────┘
```

→ 1.5s 后骨架平滑替换为真实选项「家庭中 / 工作中 / 朋友间 / 其他」。

实现要点：
1. `FollowUpDialog` 的 loading 态升级为完整骨架（标题 + 3 个占位 chip + 醒目跳过按钮）
2. 触发追问后 `requestAnimationFrame` + `scrollIntoView({ block: 'center', behavior: 'smooth' })` 把追问卡滚到视口中央
3. `generateFollowUp` 超时从 10s → **6s**，超时静默走现有 fallback（不打断流程）

### B. 最后一题闭环（解决"卡住"）

**用户场景**：李姐答完第 30 题 → **800ms 后**页面自动滚到底部，"查看结果"按钮出现脉冲高亮 + 卡片下方提示"👇 点击下方按钮生成你的报告" → 点击后深度追问 loading 卡的"跳过直接看结果"按钮立即可点。

实现要点：
1. 最后一题选答后 `setTimeout(800ms)` 滚动到提交按钮 + 加 `animate-pulse`
2. 最后一题卡片下方加一行内嵌引导文字
3. `DeepFollowUpDialog` loading 卡：分阶段文案（"分析回答 → 匹配卡点 → 生成追问"），跳过按钮加大号样式
4. `generateDeepFollowUp` 超时从 15s → **8s**，失败/超时直接 toast + `onComplete`（已是现有兜底逻辑）

### C. 稳定性与兼容

1. `disabled={showFollowUp}` 改为 `disabled={showFollowUp && !pendingNextQuestion}`，并在所有错误/超时分支显式 `setPendingNextQuestion(false)`
2. 给两个 Edge Function 调用加 `AbortController`，用户切题/退出时取消未完成请求
3. 检测低端 Android 微信 WebView（UA 含 `mmwebsdk`）时，把 motion 转场降级为纯 CSS opacity，避免帧抖

### D. 多端验收清单（人工跑一遍）

- iOS Safari 375x812（iPhone X，微信 H5）
- Android 微信 WebView 360x800
- 桌面 Chrome 1280x720
- 微信小程序 webview（`wechat.eugenewe.net`）

每端完成 30 题，重点关注：5 分追问反馈即时性、最后一题完成闭环、edge function 失败时不死锁。

---

## 三、修改清单

**仅前端**：
1. `src/components/wealth-block/WealthBlockQuestions.tsx` — 5分骨架触发、最后一题滚动+高亮、AbortController、pendingNextQuestion 全路径清理、超时缩短
2. `src/components/wealth-block/FollowUpDialog.tsx` — loading 态升级为完整骨架
3. `src/components/wealth-block/DeepFollowUpDialog.tsx` — loading 卡分阶段文案、跳过按钮强化

**不动**：评分算法、追问触发规则（`shouldAskFollowUp`）、Edge Function 业务逻辑、付款链路、路由跳转、题库内容、追问 prompt、数据库 schema、RLS。

---

## 四、若发现需要触及业务逻辑

如实施过程中发现下列任一项必须改动，**会先暂停并把方案列给你确认**：
- 触发追问的频率/条件（`shouldAskFollowUp` 规则）
- Edge Function 的 prompt、模型选择、返回字段
- 评分计算或结果生成逻辑
- 路由跳转或数据库读写
