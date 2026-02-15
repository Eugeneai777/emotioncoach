

## 优化"财富旅程"页面 — 减少层级、去除重复

### 问题分析

当前"成长档案"Tab 结构过于复杂，存在 **三层嵌套 Tabs**：

```text
主 Tabs (今日任务 / 教练对话 / 成长档案)
  └─ 成长档案 Tab
       ├─ AwakeningDashboard (日历/进度)
       └─ 嵌套 Tabs (财富旅程 / 财富简报)
            └─ 财富旅程 Tab (AwakeningArchiveTab)
                 ├─ 毕业证书卡片
                 ├─ GameProgressCard (游戏化进度)
                 ├─ CompactAchievementGrid (成就徽章)
                 ├─ GrowthHighlightsCard (成长亮点)
                 ├─ 又一层嵌套 Tabs (曲线/时间轴/对比/周报)
                 └─ CombinedPersonalityCard
```

**核心问题**：
- 3 层 Tab 嵌套，用户迷失在层级中
- GameProgressCard 与 AwakeningDashboard 展示重复的进度信息
- GrowthHighlightsCard 的数据与 GameProgressCard 高度重叠
- 4 个数据可视化子 Tab 使用频率低，增加认知负担

### 优化方案：扁平化为线性卡片流

将"财富旅程"从多层 Tab 改为单页线性滚动，合并重复内容，保留核心价值：

```text
成长档案 Tab (优化后)
  ├─ AwakeningDashboard (日历 — 保留)
  ├─ 嵌套 Tabs (财富旅程 / 财富简报 — 保留二级结构)
  │    └─ 财富旅程 (AwakeningArchiveTab — 简化内容)
  │         ├─ 毕业证书 (仅毕业用户可见 — 保留)
  │         ├─ GameProgressCard (保留，去掉与Dashboard重复的字段)
  │         ├─ 成长曲线 WealthProgressChart (直接展示，不再套Tab)
  │         ├─ CompactAchievementGrid (保留)
  │         └─ CombinedPersonalityCard (保留)
  │
  └─ 财富简报 Tab — 保留不变
```

**具体删减**：
1. **移除 GrowthHighlightsCard** — 其"连续天数/觉醒变化/行动完成率"与 GameProgressCard 和 Dashboard 重复
2. **移除 4-Tab 数据可视化区域** — 将"成长曲线"(WealthProgressChart) 直接作为独立卡片展示；移除"时间轴"(JournalTimelineView)、"周报"(WeeklyComparisonChart)、"测评对比"(GrowthComparisonCard) 这三个低频子 Tab
3. **调整排列顺序** — 毕业证书 > 游戏进度 > 成长曲线 > 成就徽章 > 财富人格

### 技术细节

**修改文件：`src/components/wealth-camp/AwakeningArchiveTab.tsx`**

1. 移除导入：`GrowthHighlightsCard`、`WeeklyComparisonChart`、`GrowthComparisonCard`、`JournalTimelineView`、`Tabs/TabsList/TabsTrigger/TabsContent`（内层的）
2. 移除相关的计算变量：`awakeningChange`、`actionCompletionRate`、`beliefsCount`、`givingActionsCount`
3. 将 `WealthProgressChart` 从 Tab 内提取为独立 `Card` 展示
4. 删除整个 4-Tab 数据可视化区域，替换为单一曲线卡片
5. 删除 `GrowthHighlightsCard` 组件调用
6. 保留：毕业证书、GameProgressCard、CompactAchievementGrid、CombinedPersonalityCard

预计代码行数从 ~260 行减少到 ~120 行，组件导入从 12 个减少到 7 个。

