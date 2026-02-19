
# 修复：主导卡点卡片不可见文字 + 雷达图比例优化

## 问题根因分析

### 问题 1：大片空白 / 文字不显示（截图中最明显的 bug）

**根因**：`dominantPoor.color` 的值是 `"from-orange-500 to-amber-500"`（Tailwind 渐变方向类），但使用方式是：

```tsx
<div className={cn("p-3 text-white rounded-lg", dominantPoor.color)}>
```

缺少 `bg-gradient-to-br`，所以渐变不生效，背景变成透明/白色，而文字是 `text-white`。

**结果**：**白色文字 on 白色背景 = 完全看不见**。截图中看到的大片空白区域，其实是有内容的（emoji + 标题 + detail + 解决方案），只是文字和背景颜色完全相同。

同样的问题也存在于情绪层（`dominantEmotion.color`，值为渐变类）和信念层（`dominantBelief.color`）。

### 问题 2：雷达图视觉比例偏小

**根因**：
- `outerRadius="60%"` 已经限制了最大半径
- 四穷雷达图中，`domain=[0, 15]`，实际值如眼穷分数 = 10-12，但嘴穷/心穷可能只有 6-7，整体形状偏向中心
- 情绪和信念雷达图的值是用总分除以5-7得到的近似值，数值偏小（约3-5），在 domain=[0,10] 的轴上显示比例偏小
- 图形显示在160px 高度的左半边格子里，实际渲染面积约 70px × 70px，感觉非常小

---

## 修复方案

### 修复一：主导卡点卡片 — 改为浅色卡片风格（确保文字可见）

将三层的主导卡点卡片，从"有颜色背景 + 白色文字"改为"浅色背景 + 深色文字 + 彩色左边框"，与整体白底调性统一，同时彻底解决文字不可见问题。

**行为层**（约第445行）：
```tsx
// 改前（文字不可见）
<div className={cn("p-3 text-white rounded-lg", dominantPoor.color)}>
  <h4 className="font-bold text-sm">{dominantPoor.name}</h4>
  <p className="text-white/80 text-[10px]">{dominantPoor.description}</p>
  <p className="text-white/90 text-xs">{dominantPoor.detail}</p>
  <div className="p-2 bg-white/20 rounded-lg">

// 改后（深色文字，浅色背景）
<div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border-l-4 border-orange-400">
  <h4 className="font-bold text-sm text-orange-900 dark:text-orange-100">{dominantPoor.name}</h4>
  <p className="text-orange-700/80 dark:text-orange-300/80 text-[10px]">{dominantPoor.description}</p>
  <p className="text-orange-800 dark:text-orange-200 text-xs">{dominantPoor.detail}</p>
  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200">
```

对于情绪层（`dominantEmotion`）和信念层（`dominantBelief`），同样应用此修复，使用各自的颜色（pink/violet）。由于每个dominant的 color 值不可预测且是渐变类，采用固定的层级颜色更安全。

具体颜色方案：
- **行为层（四穷）**：amber/orange 色系 `bg-amber-50 border-l-4 border-amber-400`，文字 `text-amber-900`
- **情绪层**：pink/rose 色系 `bg-pink-50 border-l-4 border-pink-400`，文字 `text-pink-900`
- **信念层**：violet/purple 色系 `bg-violet-50 border-l-4 border-violet-400`，文字 `text-violet-900`

### 修复二：雷达图比例优化

**两个改动**：

1. **`outerRadius` 从 60% 调整为 75%**，让图形占据更多可用空间：
```tsx
<RadarChart cx="50%" cy="50%" outerRadius="75%" data={fourPoorRadarData}>
```

2. **`domain` 改为动态计算**，基于实际数据最大值，而不是固定的15或10：
```tsx
// 四穷：实际分值最高15分，但改为动态
const fourPoorMax = Math.max(
  baseline.mouth_score || 0, baseline.hand_score || 0,
  baseline.eye_score || 0, baseline.heart_score || 0, 5
);
// 轴域：[0, 略高于最大值] 让图形填满更多空间
domain={[0, fourPoorMax]}

// 情绪和信念：同理取实际最大值作为上限
const emotionMax = Math.max(...emotionRadarData.map(d => d.baseline), 3);
domain={[0, emotionMax]}
```

这样，无论分数高低，雷达图形状都能充分填充到约75%半径处，视觉上饱满。

---

## 文件改动范围

| 文件 | 行数区间 | 改动内容 |
|------|---------|---------|
| `src/components/wealth-camp/CombinedPersonalityCard.tsx` | 445-456（行为层卡片） | 改为浅色 amber 边框卡片 |
| `src/components/wealth-camp/CombinedPersonalityCard.tsx` | 630-641（情绪层卡片） | 改为浅色 pink 边框卡片 |
| `src/components/wealth-camp/CombinedPersonalityCard.tsx` | ~815-826（信念层卡片） | 改为浅色 violet 边框卡片 |
| `src/components/wealth-camp/CombinedPersonalityCard.tsx` | 463（行为层雷达） | outerRadius 60%→75%, domain 动态 |
| `src/components/wealth-camp/CombinedPersonalityCard.tsx` | 648（情绪层雷达） | outerRadius 60%→75%, domain 动态 |
| `src/components/wealth-camp/CombinedPersonalityCard.tsx` | 843（信念层雷达） | outerRadius 60%→75%, domain 动态 |

**总改动量约 40 行，全在同一文件内，不涉及数据逻辑或其他文件。**

---

## 效果预览

**改前**：
```
[卡片头部 - 橙色条]
[空白区域————————]  ← 实为白色文字在白色背景（不可见）
 👁️                 ← 只有 emoji 能显示（因为不是文字）
[🔅                ]  ← 解决方案图标（💡，emoji可见，文字不可见）
[小雷达图，形状拥挤在中央]
```

**改后**：
```
[卡片头部 - 橙色条]
[🧿 眼穷  狭隘视角模式]       ← 完整标题（amber 深色文字）
[你习惯盯着问题和不足...]     ← detail 文字（清晰可读）
[💡 突破方案：放下控制欲...]  ← 解决方案（浅橙背景框）
[更大雷达图，形状充实到75%半径]
```
