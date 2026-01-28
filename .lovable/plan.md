

# 产品中心页面滚动问题修复计划

## 问题分析

经过排查，发现产品中心 (`Packages.tsx`) 页面无法上下滚动的原因是：

| 当前状态 | 问题 |
|:---------|:-----|
| 使用 `min-h-screen` 容器 | 没有显式启用垂直滚动 |
| 没有 `overflow-y-auto` | 内容溢出时无法滚动 |
| 缺少 `overscroll-contain` | 移动端滚动行为不一致 |

## 项目滚动标准

根据项目的移动端优化规范（memory: `unified-scrolling-container-standard`），所有主要页面应使用统一的滚动容器：

```tsx
<div 
  className="h-screen overflow-y-auto overscroll-contain bg-background"
  style={{ WebkitOverflowScrolling: 'touch' }}
>
```

正常工作的页面示例：
- `CoachSpace.tsx`: 使用此模式
- `Courses.tsx`: 使用此模式  
- `CampList.tsx`: 使用此模式

---

## 修复方案

### 修改文件: `src/pages/Packages.tsx`

**当前代码（第99行）:**
```tsx
<div className="min-h-screen bg-background">
```

**修改为:**
```tsx
<div 
  className="h-screen overflow-y-auto overscroll-contain bg-background"
  style={{ WebkitOverflowScrolling: 'touch' }}
>
```

---

## 修复原理

1. **`h-screen`**: 固定容器高度为视口高度，与 `overflow-y-auto` 配合使滚动生效
2. **`overflow-y-auto`**: 内容超出时显示垂直滚动条
3. **`overscroll-contain`**: 防止滚动到边界时触发浏览器默认行为（如下拉刷新）
4. **`WebkitOverflowScrolling: touch`**: iOS Safari 平滑滚动优化

---

## 文件修改清单

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| `src/pages/Packages.tsx` | 修改 | 更新根容器为统一滚动标准 |

---

## 验证步骤

修复后验证：
1. 在所有 Tab 页（有劲会员、有劲训练营、绽放教练等）都可以上下滚动
2. 移动端滚动流畅无卡顿
3. 滚动到边界时不会触发浏览器下拉刷新

