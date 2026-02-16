

# 修复分享卡片保存后文字和背景消失的问题

## 问题根因

在 `src/utils/shareCardConfig.ts` 的 `prepareClonedElement` 函数中，第 228 行：

```
cloned.style.background = 'transparent';
```

这行代码会覆盖卡片自身的背景样式（无论是内联 gradient 还是 Tailwind 渐变类），导致：
- 卡片背景变成白色/透明
- 白色文字在白色背景上不可见
- 所有视觉层次丢失

第二个问题：`AchievementShareCard` 使用了 `bg-clip-text text-transparent` 实现渐变文字效果，html2canvas 无法正确渲染此 CSS 特性，导致文字完全透明。

## 修复方案

### 1. `src/utils/shareCardConfig.ts` — prepareClonedElement

- 删除 `cloned.style.background = 'transparent'` 这一行，保留卡片原有的背景样式

### 2. `src/utils/shareCardConfig.ts` — onclone 回调

- 在 onclone 中检测所有使用 `bg-clip-text` 或 `-webkit-background-clip: text` 的元素
- 将它们的 `color` 改为对应的可见颜色（如 amber-400），移除 `background-clip` 和 `text-transparent`
- 这样渐变文字会降级为纯色文字，但至少可见

### 具体改动

**文件 1**: `src/utils/shareCardConfig.ts`

1. `prepareClonedElement` 中移除 `background: transparent`
2. `onclone` 回调中增加对 `background-clip: text` 元素的处理，将其降级为纯色文字

预期效果：
- 卡片背景正常显示（渐变色）
- 所有文字可见
- 渐变文字降级为纯色但仍然可读
