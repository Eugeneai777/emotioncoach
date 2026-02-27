

# 亲子训练营打卡流程重构：借鉴财富训练营模式

## 当前问题

亲子训练营打卡页 (`CampCheckIn.tsx`) 的流程与财富训练营 (`WealthCampCheckIn.tsx`) 差距很大：

| 功能 | 财富训练营 | 亲子训练营 |
|------|-----------|-----------|
| 页面结构 | 3 Tab（今日任务/教练对话/成长档案） | 3 Tab（打卡/日历/任务），但内容单薄 |
| 核心任务流 | 4 步瀑布流（冥想→教练→分享→邀请），步骤间有解锁关系 | 3 张简单卡片，点击跳转外部页面 |
| 教练对话 | 嵌入页面内，对话完成后自动打卡 | 跳转到 `/parent-coach`，用户需手动返回 |
| 打卡完成 | 自动检测+庆祝弹窗+成就检查 | 依赖 briefing 生成后的手动逻辑 |
| 补卡 | 完整补卡模式（选日→冥想→教练→自动保存） | 仅日历页补卡按钮 |
| 成长档案 | 简报分类展示（训练营/文字/语音），仪表盘+统计 | 无 |

## 重构方案

将亲子训练营打卡页改造为与财富训练营类似的沉浸式体验，核心改动：

### 1. 重构 Tab 结构（对齐财富营）

将 `CampCheckIn.tsx` 中 `parent_emotion_21` 类型的训练营改为 3 Tab：
- **今日任务** — 瀑布流步骤卡（教练对话→分享→课程）
- **教练对话** — 嵌入式亲子教练对话（不再跳转外部页面）
- **成长档案** — 打卡日历 + 简报列表

### 2. 创建亲子教练嵌入组件

新建 `src/components/parent-coach/ParentCoachEmbedded.tsx`，参考 `WealthCoachEmbedded.tsx`：
- 接收 `campId`、`dayNumber` 等 props
- 内部使用 `useParentCoach` hook 发起对话
- 对话完成后回调 `onCoachingComplete`，触发自动打卡
- 自动发送引导消息开始四部曲

### 3. 适配瀑布流步骤

创建 `src/components/camp/ParentWaterfallSteps.tsx`，基于 `WaterfallSteps.tsx` 适配：
- Step 1: 亲子教练对话（核心，无前置解锁）
- Step 2: 打卡分享（教练完成后解锁）
- Step 3: 今日课程（可选）

与财富营的区别：亲子营没有冥想环节，教练对话是第一步且无需前置解锁。

### 4. 在 CampCheckIn.tsx 中分流渲染

当 `camp.camp_type === 'parent_emotion_21'` 时，渲染新的亲子训练营布局，而非通用的打卡页。其他类型（如 `emotion_diary_21`）保持不变。

### 5. 自动打卡逻辑

当嵌入教练完成四部曲并生成简报后：
- 自动调用 `performCheckIn` 完成打卡
- 显示庆祝弹窗（复用 `CheckInCelebrationDialog` 或新建简化版）
- 更新训练营天数

### 6. 成长档案 Tab

在成长档案中展示：
- 打卡日历（复用 `CampProgressCalendar`）
- 亲子简报列表（从 `parent_coaching_sessions` 查询已完成的 session）
- 补卡入口

## 文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `src/components/parent-coach/ParentCoachEmbedded.tsx` | 嵌入式亲子教练对话组件 |
| 新建 | `src/components/camp/ParentWaterfallSteps.tsx` | 亲子营瀑布流步骤 |
| 修改 | `src/pages/CampCheckIn.tsx` | 当 camp_type 为 parent_emotion_21 时渲染新布局 |

## 技术细节

### ParentCoachEmbedded 组件

```text
Props:
- campId: string
- dayNumber: number
- onCoachingComplete: () => void

内部逻辑:
1. 使用 useParentCoach hook
2. 自动 createSession(campId)
3. 自动 sendMessage("我来完成今天的训练营打卡")
4. 渲染对话消息列表 + 输入框
5. 监听 session.status === 'completed' 时调用 onCoachingComplete
```

### CampCheckIn 分流逻辑

```text
if (camp.camp_type === 'parent_emotion_21') {
  渲染新布局：
  - PageHeader: "第X天 · 21天突破营"
  - Tabs: 今日任务 / 教练对话 / 成长档案
  - 今日任务 Tab: ParentWaterfallSteps
  - 教练对话 Tab: ParentCoachEmbedded
  - 成长档案 Tab: CampProgressCalendar + 简报列表
} else {
  保持现有通用布局
}
```

### 自动打卡流程

```text
用户进入打卡页
  → 点击"开始对话"
  → 进入教练对话 Tab
  → ParentCoachEmbedded 自动开始四部曲
  → 完成后生成简报
  → 自动调用 performCheckIn
  → 庆祝弹窗
  → 返回今日任务 Tab，显示已完成状态
```

