

# SBTI 测评历史完整展示（对齐结果页风格）

## 问题分析

当前历史页（第二张图）以压缩卡片 + 展开折叠的方式展示，信息密度过高、阅读体验差。用户期望每条历史记录的展示效果与测评结果页（第一张图）一致：雷达图直接可见、维度得分用进度条展示、AI洞察内联显示。

数据库中每条记录已包含完整的 15 维度数据（key/label/emoji/score/maxScore），数据充分支持完整展示。

## 变更计划

### 文件：`src/components/dynamic-assessment/DynamicAssessmentHistory.tsx`

重构每条记录的渲染方式，从「压缩卡片+折叠」改为「完整内联展示」：

| 区块 | 展示内容 | 响应式处理 |
|------|---------|-----------|
| 头部 | emoji + 人格类型名 + 总分Badge + 日期 | 居中排列 |
| 能力雷达 | `DimensionRadarChart` 直接展示，不折叠 | 高度自适应，移动端 220px / 桌面 280px |
| 维度得分 | 15 个维度用进度条展示（emoji + label + score/maxScore），对齐结果页样式 | 移动端单列，桌面双列 grid |
| AI 洞察 | 内联展示 `ai_insight`（如有），标题+内容卡片 | 全宽 |
| 分隔 | 记录之间用较大间距 + 分割线区分 | — |

具体改动：
1. 移除 `Collapsible` 折叠逻辑，所有内容默认展开
2. 移除 `SBTIGroupedDimensions` 组件（H/M/L 标签），改为进度条样式
3. 每条记录渲染为独立的完整卡片，包含雷达图 + 维度进度条 + AI洞察
4. 保留顶部对比功能和删除功能不变
5. 非 SBTI 测评保持现有展示不变

### 响应式兼容

- 维度得分区域：`grid grid-cols-1 md:grid-cols-2`，移动端单列、桌面双列
- 雷达图容器：移动端 `h-[220px]`，桌面 `h-[280px]`
- 整体容器：`max-w-lg mx-auto`（移动端）/ `max-w-2xl`（桌面端）

## 涉及文件

| 文件 | 变更 |
|------|------|
| `src/components/dynamic-assessment/DynamicAssessmentHistory.tsx` | 重构 SBTI 记录渲染：移除折叠、改为进度条+雷达图内联展示 |

