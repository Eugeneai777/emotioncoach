

## 简化今日任务为 4 部曲瀑布流

### 目标

将"今日任务"Tab 从当前的多卡片复杂布局，简化为清晰的 **4 步瀑布流**：

```text
1. 冥想课程 (含播放器)
2. 教练梳理 (跳转教练对话)
3. 打卡分享 (分享到社区)
4. 邀请好友 (邀请卡片)
```

### 要移除的卡片

| 卡片 | 原因 |
|------|------|
| AwakeningDashboard (日历仪表盘) | 信息密度高但非每日必要，移至"成长档案"Tab |
| UnifiedTaskCenter (任务清单+积分+挑战) | 被 4 部曲瀑布流取代 |
| NextGoalsRow (目标卡片) | 非核心流程 |
| GapReminderCard (断档提醒) | 可合并到日历中 |
| PartnerConversionCard (合伙人转化) | 非每日任务 |
| 独立的 WealthCampInviteCard | 整合到第 4 步中 |

### 新布局：4 部曲瀑布流

每个步骤是一个独立的卡片，纵向排列形成引导流程。步骤之间用连接线视觉串联。

```text
┌─────────────────────────────┐
│  Step 1: 冥想课程            │  <- 含冥想播放器（内嵌）
│  🧘 开启今日觉醒             │     完成后显示绿色对勾
│  [播放器区域]                │
└─────────────────────────────┘
         │ (连接线)
┌─────────────────────────────┐
│  Step 2: 教练梳理            │  <- 点击跳转教练对话 Tab
│  💬 深度财富对话             │     冥想未完成时锁定
└─────────────────────────────┘
         │
┌─────────────────────────────┐
│  Step 3: 打卡分享            │  <- 打开分享弹窗
│  📢 记录成长时刻             │     冥想未完成时锁定
└─────────────────────────────┘
         │
┌─────────────────────────────┐
│  Step 4: 邀请好友            │  <- 打开邀请弹窗
│  🎁 分享觉醒之旅             │
└─────────────────────────────┘
```

### 技术实现

#### 1. 新建 `src/components/wealth-camp/WaterfallSteps.tsx`

4 部曲瀑布流组件：

- 每个步骤为一张卡片，包含：序号圆圈 + 标题 + 描述 + 完成状态
- 步骤间有竖线连接（类似时间轴）
- Step 1 特殊：内嵌冥想播放器
- Step 2/3：冥想未完成时显示锁定态
- 完成的步骤：绿色对勾 + 淡化样式
- 使用 `framer-motion` 做入场动画（依次从下方滑入）

Props:
```typescript
interface WaterfallStepsProps {
  meditationCompleted: boolean;
  coachingCompleted: boolean;
  shareCompleted: boolean;
  inviteCompleted: boolean;
  onCoachingClick: () => void;
  onShareClick: () => void;
  onInviteClick: () => void;
  meditationPlayer: React.ReactNode;  // 冥想播放器作为 children 传入
}
```

#### 2. 修改 `src/pages/WealthCampCheckIn.tsx`

**今日任务 Tab 内容替换为：**

- 保留：补卡模式提示条 + 补卡成功提示（原有逻辑）
- 移除：AwakeningDashboard、UnifiedTaskCenter、NextGoalsRow、PartnerConversionCard、GapReminderCard、独立的 WealthCampInviteCard
- 新增：`WaterfallSteps` 组件，将冥想播放器嵌入 Step 1
- 将 AwakeningDashboard 移动到"成长档案"Tab 顶部

#### 3. 补卡模式处理

补卡模式下：
- Step 1 显示补卡天的冥想
- Step 2 在冥想完成后，展开内嵌教练对话（保留现有补卡逻辑）
- Step 3/4 在补卡模式下隐藏

### 视觉设计

- 时间轴连接线：2px 宽，amber 渐变色
- 活跃步骤：amber 边框高亮 + 微动效
- 锁定步骤：灰色半透明 + 锁图标
- 完成步骤：emerald 边框 + 对勾
- 全部完成时：顶部显示庆祝横幅

