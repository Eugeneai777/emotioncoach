
## 毕业目标行：图标重复 + 颜色对比度优化

### 问题分析

在 `src/components/camp/TrainingCampCard.tsx` 第 190-193 行：

1. **图标重复**：同时使用了 lucide `Target` 图标和 🎯 emoji，视觉冗余
2. **85 分不突出**：数字使用 `text-base` 加粗但颜色与周围文字相同（`text-amber-600`），没有跳出来
3. **文字与背景对比度低**：`text-amber-600` 文字在 `bg-amber-50/60` 背景上颜色太接近

### 修改方案

**文件：`src/components/camp/TrainingCampCard.tsx`（第 190-193 行）**

1. 移除 lucide `Target` 图标，只保留 🎯 emoji（更直观生动）
2. 将整行文字颜色从 `accentColor`（amber-600）改为更深的 `text-amber-900 dark:text-amber-100`，提高与背景对比度
3. 将 85 分数字改为更大更醒目的样式：`text-lg font-extrabold text-amber-700 dark:text-amber-300`，并可加下划线或特殊背景突出

具体改动：
```tsx
// 之前
<Target className={`h-4 w-4 shrink-0 ${colors.accentColor}`} />
<span className={colors.accentColor}>🎯 毕业目标：觉醒分达到 <strong className="text-base">{graduationTarget}</strong> 分</span>

// 之后
<span className="text-amber-900 dark:text-amber-100">
  🎯 毕业目标：觉醒分达到 
  <strong className="text-lg font-extrabold text-amber-700 dark:text-amber-300">{graduationTarget}</strong> 分
</span>
```

如果不再使用 `Target` 图标，还可以从顶部 import 中清理掉（如果其他地方未使用）。

### 涉及文件

- `src/components/camp/TrainingCampCard.tsx` — 移除重复图标、增强分数和文字对比度
