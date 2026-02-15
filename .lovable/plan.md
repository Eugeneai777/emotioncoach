

## 去除三层基线进度条

从"财富觉醒起点"卡片中删除行为/情绪/信念三条进度条。

### 具体操作

**文件**：`src/components/wealth-block/AwakeningJourneyPreview.tsx`

1. 删除第 214-233 行的"三层基线 - 进度条"代码块
2. 清理不再使用的变量（`layers`, `getAwakeningPercent`, `behaviorAwakening`, `emotionAwakening`, `beliefAwakening`，第 110-123 行）
3. 清理不再需要的 props（`behaviorScore`, `emotionScore`, `beliefScore`）和对应的 interface 定义
4. 更新 `WealthBlockResult.tsx` 中调用处，移除传入的三个 score props

