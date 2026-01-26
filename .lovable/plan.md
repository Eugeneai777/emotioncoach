

# 情绪健康测评页面滚动问题修复方案

## 问题分析

通过对比项目中已修复的页面（如 `SCL90Page.tsx`、`EnergyStudio.tsx`），发现 `EmotionHealthPage.tsx` 缺少移动端滚动优化配置：

| 页面 | 当前配置 | 正确配置 |
|------|----------|----------|
| EmotionHealthPage | `min-h-screen bg-background` | `h-screen overflow-y-auto overscroll-contain` |
| SCL90Page | ✅ `h-screen overflow-y-auto overscroll-contain` | 已修复 |
| EnergyStudio | ✅ `h-screen overflow-y-auto overscroll-contain` | 已修复 |

### 问题原因

1. **缺少 `overflow-y-auto`**：页面无法正确处理溢出内容的滚动
2. **缺少 `h-screen`**：没有固定高度容器，移动端滚动行为不稳定
3. **缺少 `overscroll-contain`**：可能触发浏览器默认的拉拽行为
4. **缺少 `WebkitOverflowScrolling: 'touch'`**：iOS 设备滚动不流畅

---

## 修复方案

### 修改 `src/pages/EmotionHealthPage.tsx`

**修改前（第126行）：**
```tsx
<div className="min-h-screen bg-background">
```

**修改后：**
```tsx
<div 
  className="h-screen overflow-y-auto overscroll-contain bg-background" 
  style={{ WebkitOverflowScrolling: 'touch' }}
>
```

---

## 技术细节

### CSS 属性说明

- `h-screen`：设置容器高度为视口高度，为滚动创建边界
- `overflow-y-auto`：允许垂直滚动
- `overscroll-contain`：阻止滚动链传播，避免触发父级滚动
- `WebkitOverflowScrolling: 'touch'`：启用 iOS 惯性滚动

### 符合项目规范

此修复遵循项目 Memory 中记录的标准：

> **mobile/viewport-adaptation-standard-v2**: CoachLayout and main containers use 'w-full max-w-full overflow-x-hidden' to prevent horizontal scrollbars

> **mobile/coach-layout-scrolling-standard-zh**: Main container uses fixed height (h-screen/h-dvh) with 'overflow-hidden' and 'overscroll-y-contain' to ensure stable vertical scrolling

---

## 实施步骤

| 步骤 | 内容 |
|------|------|
| 1 | 修改 `EmotionHealthPage.tsx` 根容器 CSS 类 |
| 2 | 添加 `WebkitOverflowScrolling` 内联样式 |

修改完成后，页面将支持正常的上下滚动操作。

