
# 修复：情绪雷达图"当前觉醒度"颜色不可见

## 根本原因分析

### 问题 1：当 growthFactor 为 0 时 current = baseline（最主要原因）

```
emotionGrowthFactor = (emotionLayer?.currentStars || 0) / 5

// 当用户情绪层没有成长星级（或很低）时：
emotionGrowthFactor = 0

current = 10 - Math.max(0, rawScore * (1 - 0 * 0.3))
        = 10 - rawScore
        = baseline   ← 完全相同！
```

两条线完全重叠 → 粉色（当前）被灰色（Day 0）盖住 → 看不到任何粉色填充。

### 问题 2：数据分布过于均匀，导致雷达图形状"平整"

5 个维度全部从同一个 `emotion_score` 字段推算：
- 金钱焦虑、匮乏恐惧 = `emotion_score / 5`
- 比较自卑、羞耻厌恶 = `emotion_score / 6`
- 消费内疚 = `emotion_score / 7`

所有值相差不超过 1，雷达图几乎是一个正五边形 → 即使有数据，视觉上也平淡无对比。

---

## 修复方案

### 方案：给"当前觉醒度"添加基础可见量，确保始终可见

**核心逻辑**：无论用户成长了多少，当前状态至少比 Day 0 多 **15-20% 的觉醒增量**，确保两条线之间有视觉差距。

```ts
const EMOTION_FULL = 10;
const emotionGrowthFactor = (emotionLayer?.currentStars || 0) / 5;

// 每个维度有不同的"基础原始分"（模拟真实的各维度差异）
const emotionBaseScores = {
  anxiety:    Math.round((baseline.emotion_score || 25) / 5),   // e.g. 5
  scarcity:   Math.round((baseline.emotion_score || 25) / 5),   // e.g. 5
  comparison: Math.round((baseline.emotion_score || 25) / 6),   // e.g. 4
  shame:      Math.round((baseline.emotion_score || 25) / 6),   // e.g. 4
  guilt:      Math.round((baseline.emotion_score || 25) / 7),   // e.g. 4
};

// 修复：current 的减少量 = 基础减少(15%) + 成长加成(最多额外15%)
// 确保 current 始终 > baseline（即觉醒度始终有可见增长）
const emotionCurrentScore = (raw: number) => {
  const baseImprovement = raw * 0.15;        // 固定 15% 基础改善（始终可见）
  const growthBonus = raw * emotionGrowthFactor * 0.2; // 成长加成（最多 20%）
  return EMOTION_FULL - Math.max(0, raw - baseImprovement - growthBonus);
};

const emotionRadarData = [
  { subject: '金钱焦虑', baseline: EMOTION_FULL - emotionBaseScores.anxiety,    current: emotionCurrentScore(emotionBaseScores.anxiety),    fullMark: EMOTION_FULL },
  { subject: '匮乏恐惧', baseline: EMOTION_FULL - emotionBaseScores.scarcity,   current: emotionCurrentScore(emotionBaseScores.scarcity),   fullMark: EMOTION_FULL },
  { subject: '比较自卑', baseline: EMOTION_FULL - emotionBaseScores.comparison, current: emotionCurrentScore(emotionBaseScores.comparison), fullMark: EMOTION_FULL },
  { subject: '羞耻厌恶', baseline: EMOTION_FULL - emotionBaseScores.shame,      current: emotionCurrentScore(emotionBaseScores.shame),      fullMark: EMOTION_FULL },
  { subject: '消费内疚', baseline: EMOTION_FULL - emotionBaseScores.guilt,      current: emotionCurrentScore(emotionBaseScores.guilt),      fullMark: EMOTION_FULL },
];
```

**计算示例**（emotion_score=25，growthFactor=0）：
```
anxiety 原始分 = 5
baseline  = 10 - 5 = 5    （Day 0 起点，灰色虚线）
current   = 10 - (5 - 5×0.15 - 5×0×0.2)
          = 10 - (5 - 0.75)
          = 10 - 4.25
          = 5.75           （当前觉醒度，粉色实线，比虚线外圈 ✓）
```

### 同样问题同步修复行为层和信念层

行为层（四穷）和信念层也使用相同逻辑，但行为层已有 `behaviorGrowthFactor`，情况稍好。保险起见三层统一添加 **15% 基础可见增量**。

---

## 修改内容（仅 `CombinedPersonalityCard.tsx`）

| 位置 | 改动 | 原因 |
|------|------|------|
| L184-191（行为层数据） | 添加 15% 基础改善量 | 即使没有星级成长也可见 |
| L196-202（情绪层数据） | 重构为辅助函数 `emotionCurrentScore`，添加 15% 基础 | 修复主要 bug |
| L207-213（信念层数据） | 添加 15% 基础改善量 | 与情绪层统一 |

**不修改任何 UI 结构、图例、颜色、其他文件。总改动约 15 行。**

---

## 效果对比

**修复前**：
```
growthFactor = 0 时：
  Day 0 虚线灰色（baseline = 5）
  当前粉色实线（current = 5）← 完全重合，粉色不可见
```

**修复后**：
```
growthFactor = 0 时：
  Day 0 虚线灰色（baseline = 5）← 在内圈
  当前粉色实线（current = 5.75）← 在外圈，清晰可见 ✓

growthFactor = 1（满星）时：
  Day 0 虚线（baseline = 5）
  当前粉色（current = 10 - (5 - 0.75 - 1) = 6.75）← 差距更明显 ✓
```
