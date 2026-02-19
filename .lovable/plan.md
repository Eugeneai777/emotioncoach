
# 修复：仅修改财富画像卡片的雷达图数据语义

## 范围澄清

| 文件 | 雷达图类型 | 是否需要改 | 原因 |
|------|-----------|-----------|------|
| `WealthBlockResult.tsx`（测评结果页） | 单线，显示当前卡点分数 | **不需要改** | 只有一条线，无对比关系，数值越大表示卡点越重，语义自洽 |
| `CombinedPersonalityCard.tsx`（财富画像卡片） | 双线对比（虚线=Day 0，实线=当前） | **需要改** | 目前虚线（baseline）> 实线（current），视觉上看起来"越来越差"，实际相反 |

---

## 根本原因

`CombinedPersonalityCard.tsx` 第 184-209 行的数据格式：

```ts
// 目前：卡点分数语义（越高越差）
{ subject: '嘴穷', baseline: 12, current: 10.9 }
//                  ↑ Day 0 虚线    ↑ 当前实线
//                  数值大=图形靠外  数值小=图形靠内
```

**视觉结果**：虚线（Day 0）在实线（当前）的外圈，用户看到"我变差了？"

**期望结果**：实线在外，表达"觉醒度提升了"

---

## 修复方案：翻转为"觉醒度"语义

公式：`觉醒度 = 满分 - 卡点分数`

```ts
// 修复后：觉醒度语义（越高越好）
const FOUR_POOR_FULL = 15;

// Day 0 起点觉醒度（低）
baseline: FOUR_POOR_FULL - (raw_score)    // 例：15 - 12 = 3（靠内）

// 当前觉醒度（因练习而提升，高）
current: FOUR_POOR_FULL - (raw_score * (1 - growthFactor * 0.3))  // 例：15 - 10.9 = 4.1（靠外）
```

**修复前后对比**：
```
修复前：baseline=12(虚线外)  current=10.9(实线内)  → 看起来退步
修复后：baseline=3 (虚线内)  current=4.1(实线外)   → 看起来成长 ✓
```

---

## 具体改动（仅 `CombinedPersonalityCard.tsx`）

### 改动一：行为层四穷雷达数据（约第 184-189 行）

```ts
// 改前
{ subject: '嘴穷', baseline: baseline.mouth_score || 0, current: Math.max(0, (baseline.mouth_score || 0) * (1 - behaviorGrowthFactor * 0.3)), fullMark: 15 },

// 改后
const FOUR_POOR_FULL = 15;
{ subject: '嘴穷', 
  baseline: FOUR_POOR_FULL - (baseline.mouth_score || 0), 
  current: Math.min(FOUR_POOR_FULL, FOUR_POOR_FULL - Math.max(0, (baseline.mouth_score || 0) * (1 - behaviorGrowthFactor * 0.3))), 
  fullMark: FOUR_POOR_FULL 
}
// 同理 hand/eye/heart
```

轴域同步固定为 `domain={[0, 15]}`。

### 改动二：情绪层雷达数据（约第 193-199 行）

```ts
const EMOTION_FULL = 10;
// 每条数据：baseline: EMOTION_FULL - rawValue, current: EMOTION_FULL - reducedRawValue
// 5条维度（金钱焦虑/匮乏恐惧/比较自卑/羞耻厌恶/消费内疚）全部翻转
```

轴域固定为 `domain={[0, 10]}`。

### 改动三：信念层雷达数据（约第 203-209 行）

```ts
const BELIEF_FULL = 10;
// 5条维度（匮乏感/线性思维/金钱污名/不配得感/关系恐惧）全部翻转
```

轴域固定为 `domain={[0, 10]}`。

### 改动四：图例文字同步更新（三处）

```tsx
// 改前
<span>Day 0 基线</span>   // 虚线，数值大，在外
<span>当前状态</span>     // 实线，数值小，在内

// 改后
<span>Day 0 起点</span>   // 虚线，觉醒度低，在内
<span>当前觉醒度 ↑</span> // 实线，觉醒度高，在外
```

---

## 修改文件清单

| 文件 | 行数范围 | 内容 | 影响 |
|------|---------|------|------|
| `CombinedPersonalityCard.tsx` | L184-189 | 行为层雷达数据翻转 | 实线出现在虚线外面 |
| `CombinedPersonalityCard.tsx` | L193-199 | 情绪层雷达数据翻转 | 同上 |
| `CombinedPersonalityCard.tsx` | L203-209 | 信念层雷达数据翻转 | 同上 |
| `CombinedPersonalityCard.tsx` | 三处图例 | 图例文字语义更新 | 用户理解正确含义 |

**不涉及 `WealthBlockResult.tsx`（测评结果页）的任何改动。**
**共改动约 20 行，全在 `CombinedPersonalityCard.tsx`。**
