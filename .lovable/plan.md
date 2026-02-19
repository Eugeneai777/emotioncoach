
# 将"觉醒指数"设为默认显示图表

## 问题

用户希望打开成长曲线时，默认就看到**整体觉醒指数（0-100）**的变化，而不是行为维度（当前 `useState<DimensionKey>('behavior')`）。

---

## 解决方案

需要同时完成两件事：

### 1. 新增 `awakening` 维度（在上次计划已设计好）

在 `WealthProgressChart.tsx` 中：

- **新增 props** `baselineAwakening?: number`
- **`DimensionKey` 扩展**为 `'behavior' | 'emotion' | 'belief' | 'awakening'`
- **`chartData` 新增 `觉醒指数` 字段**：
  - 第 0 天 → `baselineAwakening`（如 45）
  - 第 N 天 → 三维星分均值换算为 0-100：`Math.round(((avg - 1) / 4) * 100)`
- **Y 轴动态适配**：当 `activeDimension === 'awakening'` 时，`domain=[0,100]`，`ticks=[0,20,40,60,80,100]`
- **默认维度改为 `'awakening'`**：`useState<DimensionKey>('awakening')`
- **新增 Toggle 按钮"觉醒"**（琥珀金 / 渐变色）
- **统计区适配**：觉醒维度显示"起点 / 当前 / 成长 / 峰值"

### 2. `AwakeningArchiveTab.tsx` 传入 `baselineAwakening`

从 `progress.baseline_awakening`（`useAwakeningProgress` 已有此字段）传给图表：

```tsx
<WealthProgressChart 
  entries={...}
  baseline={...}
  baselineAwakening={progress?.baseline_awakening}
/>
```

---

## 图表效果（觉醒维度，默认显示）

```text
Y轴(0-100)
100|
 78|              ● 78（绿色，当前）
 61|         ●
 52|    ●
 45| ◆（灰色，第0天起点）
  0|________________________
   第0天  第1天  第2天  第3天

统计区：起点 45  当前 78  成长 +33↑  峰值 第3天
```

---

## 修改文件

- **`src/components/wealth-camp/WealthProgressChart.tsx`**：
  - `useState` 默认值改为 `'awakening'`
  - 新增 `awakening` 维度、Y 轴 0-100、`觉醒指数` 字段、统计卡片
  - 新增 `baselineAwakening` prop

- **`src/components/wealth-camp/AwakeningArchiveTab.tsx`**：
  - 传入 `baselineAwakening={progress?.baseline_awakening}`
