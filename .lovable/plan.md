
# 修复觉醒指数图表：数据一致性问题

## 问题根因

截图展示了同一个页面（archive tab）里两套互相矛盾的数字：

- **图表内统计栏**：起点45，当前58，成长 +13
- **GameProgressCard**：78分（+33）

这两套数字用的是**完全不同的计算逻辑**，根本不是同一个东西在显示。

### Bug 1：图表"当前值"用的是最后一天的瞬时分

图表的 `dimensionStats.awakening.current` 取的是：
```
awakeningValues[awakeningValues.length - 1]  // 最后一天的觉醒指数
```
所以如果第7天状态稍差，显示58。

而 GameProgressCard 的78分用的是 `progress.current_awakening`（存在数据库里的**最佳3天平均值**）。

### Bug 2：图表第1天显示8分，第2天显示0分

图表中计算每天觉醒指数时，当某天只有部分维度有数据（比如行为=1.3星，情绪=0，信念=0），avg会很低接近1，导致：
- `((1.3 - 1) / 4) * 100 ≈ 7.5` → 显示8分（图上极低，几乎贴近0轴）

而如果某天用户做了语音梳理但评分都是1-2星（刚开始训练），图表就会在第1、2天显示接近0的极低值，视觉上像"没有数据"。

这与 GameProgressCard 78分的"峰值思维"完全割裂，给用户一种"我到底是78分还是8分"的严重困惑。

### Bug 3：图表统计栏的"当前"与"成长"与页面其他组件不一致

用户会同时看到：
- 图表内：当前 = 58，成长 = +13
- 上方卡片：78分，+33
- 激励文案："你已突破起点13分"（基于图表的错误数值）

---

## 解决方案

### 核心原则：图表统计栏与 GameProgressCard 使用同一套计算标准

**统一标准 = 最佳3天平均值**（与 `useEnsureAwakeningProgress` 和 `useWealthJournalEntries` 中的 `awakeningIndex` 一致）

### 修改 1：`WealthProgressChart.tsx` — 统计栏改用"最佳3天平均"

在 `dimensionStats` 的 `useMemo` 中，修改 `awakening.current` 的计算方式：

```typescript
// 改前：最后一天
const awakeningCurrent = awakeningValues[awakeningValues.length - 1]

// 改后：最佳3天平均（与GameProgressCard一致）
const sorted = [...awakeningValues].sort((a, b) => b - a);
const bestDays = sorted.slice(0, Math.min(3, sorted.length));
const awakeningCurrent = Math.round(bestDays.reduce((a, b) => a + b, 0) / bestDays.length);
```

同时修改 `awakening.growth`：
```typescript
// growth = 最佳3天平均 - Day0基准（与GameProgressCard的+33一致）
const awakeningGrowth = awakeningStart !== undefined ? awakeningCurrent - awakeningStart : 0;
```

这样图表的"起点45 当前78 成长+33"就和上方GameProgressCard完全一致了。

### 修改 2：`WealthProgressChart.tsx` — 图表折线仍然按天展示瞬时值（不变）

折线图上每天的点仍然显示**当天的瞬时觉醒指数**（这是正确的，折线图的目的就是展示每日波动）。统计栏（起点/当前/成长/峰值）才是汇总指标，需要与 GameProgressCard 一致。

峰值（peak）保持不变，仍然是所有天中的最高值。

### 修改 3：`WealthProgressChart.tsx` — 修复低分天数导致极低显示的视觉问题

当某天的日志评分所有维度都填了，但评分都是1-2星（初期用户），图表会显示极低点（5-25分）紧贴x轴，视觉上像"没有进展"。

添加一个最低显示阈值处理：如果当天所有维度都有数据（`hasData=true`），但计算出的觉醒指数 < 5，则还是正常显示该低值（保持客观真实性），但在tooltip里加注"初期记录"说明，不误导用户。

实际上第1天8分、第2天0分的问题，0分是因为某天评分为0（没有有效数据）。修复如下：

在 `chartData` 里，`avg > 0` 的条件判断：
```typescript
// 当前：avg > 0 时才算觉醒指数，否则为0
const awakening = avg > 0 ? starsToAwakening(avg) : 0;
```

这里0分意味着该天的记录可能没有任何评分字段（文字梳理条目），是正确的。但视觉上紧贴x轴的0让用户以为数据出错。

解决方案：当 `!hasData`（该天无评分）时，把该点改为 `null` 而非 `0`，让折线在该点断开（gap），而不是下坠到0：
```typescript
觉醒指数: hasData ? awakening : null,
```

这样文字梳理天（无分数）的点会在折线图上形成断点，而不是显示为0。

### 修改 4：激励文案同步更新

激励文案里的 `g`（growth）现在是修正后的 `awakeningStats.growth`，已经与 GameProgressCard 一致，所以文案会自动显示"+33"这样的正确数值，无需额外修改。

---

## 修改文件清单

**仅需修改一个文件**：`src/components/wealth-camp/WealthProgressChart.tsx`

1. **第61-77行** (`chartData` useMemo 中)：将 `觉醒指数` 在无数据时设为 `null` 而非 `0`（修复第2天=0的问题）

2. **第120-126行** (`dimensionStats` useMemo 中)：将 `awakeningCurrent` 从"最后一天"改为"最佳3天平均"（修复78 vs 58 的不一致）

3. **Recharts `Line` 组件**：添加 `connectNulls={false}` 确保null值形成断点而不是连接（Recharts 默认不连接null，确认即可）

---

## 修改效果

**修改后：**
- 图表统计栏：起点 45，当前 **78**，成长 **+33** ← 与 GameProgressCard 完全一致 ✅
- 激励文案：🚀 你已突破起点 **33** 分，正以飞速蜕变中，继续前进！ ✅
- 折线图：第2天（文字梳理，无分数）显示为断点，而不是0 ✅
- 折线图：每天的点仍然反映当天真实评分（波动曲线保持） ✅
