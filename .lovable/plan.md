
# 成长曲线：加入第 0 天起点，X 轴改为实际完成顺序

## 当前问题

1. **没有第 0 天数据点**：基准线只是一条虚线（ReferenceLine），不是图表上的真实数据点，看不出"从哪里出发"
2. **X 轴按 day_number 填充，有空缺**：比如用户打了 Day 1 和 Day 3，Day 2 会显示为 0，图表出现凹坑
3. **标签仍显示 "Day N" 而非 "第 N 天"**：与日记卡片的显示不一致
4. **统计区 "(Day N)" 也用旧格式**

---

## 解决方案：修改 `WealthProgressChart.tsx`

### 1. 重建 `chartData`，以实际完成顺序为准

**新逻辑：**
```
第 0 天 → 测评基准（blockScoreToAwakeningStars 转换）
第 1 天 → 按 created_at 升序，第 1 条日记
第 2 天 → 第 2 条日记
...
```

不再用 `day_number` 做 X 轴索引，改为：
- 将 entries 按 `created_at` 升序排列
- 依次分配序号 1, 2, 3…
- 在最前面插入第 0 天（baseline）

```typescript
const chartData = useMemo(() => {
  // 第 0 天：测评基准转换为觉醒星数（1-5）
  const day0 = baselineValues ? {
    day: '第 0 天',
    dayNum: 0,
    行为流动度: baselineValues.behavior,
    情绪流动度: baselineValues.emotion,
    信念松动度: baselineValues.belief,
    hasData: true,
    isBaseline: true,
  } : null;

  // 按 created_at 升序排列
  const sorted = [...entries].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const journalPoints = sorted.map((entry, index) => {
    const b = entry.behavior_score ?? 0;
    const em = entry.emotion_score ?? 0;
    const be = entry.belief_score ?? 0;
    return {
      day: `第 ${index + 1} 天`,
      dayNum: index + 1,
      行为流动度: b,
      情绪流动度: em,
      信念松动度: be,
      hasData: b > 0 || em > 0 || be > 0,
      isBaseline: false,
    };
  });

  return day0 ? [day0, ...journalPoints] : journalPoints;
}, [entries, baselineValues]);
```

### 2. 基准点在图表中特殊标注

第 0 天点（isBaseline=true）使用**菱形/星形**样式区分，或加一个更大的实心圆 + 边框，让用户一眼看出这是起点。

```typescript
// 自定义 dot 中
if (payload.isBaseline) {
  return (
    <circle cx={cx} cy={cy} r={8}
      fill="#6b7280" stroke="#4b5563" strokeWidth={2}
    />
  );
}
```

### 3. 移除独立 `ReferenceLine`（可选保留作辅助）

因为第 0 天已经是数据点，ReferenceLine 变成重复。可将其改为更细的虚线辅助，或完全移除，由第 0 天节点本身承担基准角色。

### 4. 更新统计区标签

峰值括号里 `(Day N)` → `(第 N 天)`：

```tsx
// 修改前
<span className="text-muted-foreground text-[10px]">
  (Day {dimensionStats[activeDimension].peakDay})
</span>

// 修改后
<span className="text-muted-foreground text-[10px]">
  (第 {dimensionStats[activeDimension].peakDay} 天)
</span>
```

同时更新 `peakDay` 的计算逻辑，使其对应新的序号（第 0 天的基准点序号为 0，日记条目序号为 1, 2, 3…）。

---

## 视觉效果对比

**修改前：**
```
Y轴                             
5 |                 ●  
4 |      ●          
3 | - - - - - - -   ← 虚线基准（看不出起点）
2 |                 
1 |___________________
    Day1  Day2  Day3
```

**修改后：**
```
Y轴
5 |              ●(绿色，突破)
4 |         ●
3 | ◆(灰色，第0天基准)  
2 |
1 |_______________________
  第0天  第1天  第2天  第3天
```

用户清楚看到：
- ◆ 第 0 天 = 测评起点（我从哪里出发）
- ● 第 N 天 = 每次打卡（绿色=突破起点，橙/粉/紫=正常）
- 成长曲线从起点向上爬升的弧线

---

## 修改文件

- **`src/components/wealth-camp/WealthProgressChart.tsx`**（唯一需要修改的文件）
  - 重建 `chartData`：第 0 天 + 按 `created_at` 升序的日记条目
  - 更新自定义 dot 渲染，第 0 天显示特殊样式
  - 统计区 "(Day N)" → "(第 N 天)"
  - 移除或弱化 ReferenceLine（已由第 0 天节点替代）
  - `peakDay` 统计对应新序号

`AwakeningArchiveTab.tsx` 无需修改，`baseline` 已正确传入。
