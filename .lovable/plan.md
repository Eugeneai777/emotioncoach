
# 问题根因与修复方案

## 问题分析

用户的完整操作路径：

```text
财富觉醒训练营首页（/wealth-camp-intro 或 /coach/wealth_coach_4_questions）
    ↓ 点击"继续训练营"
我的财富日记（/wealth-camp-checkin）—— Tab: 今日任务
    ↓ 点击"开始教练梳理"（handleStartCoaching → setActiveTab('coaching')）
我的财富日记（/wealth-camp-checkin）—— Tab: 教练对话（WealthCoachEmbedded）
    ↓ 点击"开始教练梳理"按钮（WealthCoachEmbedded 内部）
    ↓ 这里 WealthCoachEmbedded 直接调用 sendMessage，不跳页面 ✅
```

但截图显示用户看到的是**独立的 `/wealth-coach-chat` 页面**（有完整 CoachLayout Header），说明存在另一条入口路径导致用户进入了独立的教练页面。

**核心问题**：当用户从 `/wealth-coach-chat`（独立教练页面）点击返回时：
- 左上角的 Logo 会导航到 `/`（首页/SmartHomeRedirect）
- 微信/浏览器底部的 `<` 按钮调用 `history.go(-1)`，回到上一条历史记录

如果导航链是：`训练营首页 → 财富日记页 → 独立教练页`，那么从独立教练页点 `<` 应该回到财富日记页才对。

但实际回到了训练营首页，说明**进入独立教练页时没有经过财富日记页**，即存在直接从训练营首页跳到 `/wealth-coach-chat` 的入口，绕过了 `/wealth-camp-checkin`。

## 需要排查的入口

`CoachTrainingCamp` 组件（在 WealthCoachChat 的 CoachLayout 中使用）里的"继续训练营"按钮，很可能是直接导航到 `/wealth-coach-chat`（独立教练页）而非 `/wealth-camp-checkin`（财富日记页）。

## 修复方案

**修复 `CoachTrainingCamp` 组件中的"继续训练营"按钮**，使其跳转到 `/wealth-camp-checkin` 而非停留在或重新加载 `/wealth-coach-chat`。

同时，**在 `WealthCoachChat` 独立页面中添加"返回财富日记"的明确返回逻辑**：当页面是通过训练营入口（`locationState?.fromCamp === true`）进来时，返回按钮（或 CoachHeader 中的"返回主页"）应导航到 `/wealth-camp-checkin`，而非调用 `onNewConversation`。

## 具体修改

### 1. 查找并修复 CoachTrainingCamp 中的导航逻辑

在 `CoachTrainingCamp` 组件里的"继续训练营"按钮，将跳转目标从任何非 `/wealth-camp-checkin` 的地址改为 `/wealth-camp-checkin`。

### 2. 在 WealthCoachChat 页面添加 fromCamp 返回逻辑

在 `WealthCoachChat.tsx` 中，当 `locationState?.fromCamp` 为 true 时，将 `onRestart`/`onNewConversation` 的行为从重置对话改为导航回 `/wealth-camp-checkin`，确保用户点击返回时回到正确页面。

### 3. 在 CoachLayout 的 onRestart 中支持自定义路由

给 `CoachLayout` 增加 `backRoute` prop（可选），当设置了 backRoute 且用户点击返回时，导航到指定路由而非重置对话。

## 修改文件

| 文件 | 改动内容 |
|------|---------|
| `src/components/coach/CoachTrainingCamp.tsx` | 确认并修复"继续训练营"按钮跳转目标为 `/wealth-camp-checkin` |
| `src/pages/WealthCoachChat.tsx` | 当 fromCamp 为 true 时，将 onRestart 改为 navigate('/wealth-camp-checkin') |
| `src/components/coach/CoachLayout.tsx` | 新增可选 backRoute prop，点击 Logo 或返回时支持自定义路由 |
