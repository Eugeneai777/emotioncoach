

# 训练营专注模式实现计划

## 概述

当用户从训练营打卡页进入亲子教练（URL 含 `campId` 参数）时，简化页面、自动开启对话、添加返回训练营按钮和上下文提示。

## 修改范围

仅修改 **`src/pages/ParentCoach.tsx`**，约 20-30 行改动。

---

## 具体改动

### 1. 返回训练营按钮

在 `CoachLayout` 上添加 `backRoute` prop：

- 当 `campId` 存在时，传入 `/camp-checkin/${campId}`
- CoachHeader 已支持 `backRoute`，左上角 logo 点击会返回训练营页面

### 2. 隐藏无关模块

当 `campId` 存在时：

- `trainingCamp` prop 传 `undefined`（隐藏引导卡片、双轨模式入口、训练营推荐）
- `community` prop 传 `undefined`（隐藏社区瀑布流）
- `notifications` prop 传 `undefined`（隐藏通知模块）
- `scenarioChips` prop 传 `undefined`（隐藏场景选择）
- `voiceChatCTA` prop 传 `undefined`（隐藏语音通话入口）

### 3. 训练营上下文横幅

在 `stageProgress` slot 中，阶段进度条上方添加训练营信息横幅：

- 显示格式：`🏕️ 第X天 · 营名`（如"第5天 · 21天青少年困境突破营"）
- 使用已有的 `existingParentCamp` 数据获取 `current_day` 和 `camp_name`
- 紫色渐变小卡片样式，与页面主题一致

### 4. 自动发送引导消息

在 `initSession` 的 `useEffect` 中：

- session 创建成功后，若 `campId` 存在，自动调用 `sendMessage("我来完成今天的训练营打卡")`
- 这样教练会主动开场，用户无需思考如何开始

---

## 技术细节

```text
campId 存在时的页面结构：
+---------------------------------------------+
| CoachHeader (backRoute -> /camp-checkin/xxx) |
+---------------------------------------------+
| [训练营横幅: 第X天 · 营名]                    |
| [阶段进度条]                                  |
| [对话内容 - 自动开场]                         |
+---------------------------------------------+
| [输入框]                                      |
+---------------------------------------------+

隐藏的模块：
- ParentOnboardingGuide
- TeenModeEntryCard / ProblemTypeCard
- CoachTrainingCamp
- CommunityWaterfall
- CoachNotificationsModule
- CoachScenarioChips
- ParentVoiceCallCTA
```

### 关键代码逻辑

1. `backRoute={campId ? `/camp-checkin/${campId}` : undefined}` 加到 CoachLayout
2. `trainingCamp={campId ? undefined : (<>...</>)}` 条件渲染
3. `useEffect` 中 `createSession` 成功后检查 `campId`，调用 `sendMessage`
4. `stageProgress` slot 中前置训练营横幅小卡片

