

## 去除三层觉醒度百分比区域

移除 `EnhancedHealthGauge.tsx` 中第 139-152 行的 "Layer Awakening Percentages" 部分（行为/情绪/信念 觉醒度 XX%），同时清理不再使用的 `layers` 数组定义和相关 import（`layerScoreToAwakeningPercent`、`getAwakeningTextColor`）。

### 技术细节

**文件：`src/components/wealth-block/EnhancedHealthGauge.tsx`**

- 删除第 139-152 行的三层觉醒度显示区块
- 删除第 30-34 行的 `layers` 数组定义
- 如果 `layerScoreToAwakeningPercent` 和 `getAwakeningTextColor` 仅在此处使用，从 import 中移除
- Props 中的 `behaviorScore`、`emotionScore`、`beliefScore` 可保留（其他组件可能传入），但不再在此组件内使用

