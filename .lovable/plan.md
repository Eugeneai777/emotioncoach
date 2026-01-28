

# 修复汉堡菜单页面无法滚动问题

## 问题诊断

经过代码分析，发现多个从汉堡菜单进入的页面使用了 `min-h-screen` 布局，但没有设置正确的滚动属性。这会导致在移动端（特别是微信内嵌浏览器或某些 Android 设备）无法正常上下滚动。

根据项目的统一滚动标准，需要使用：
- `h-screen overflow-y-auto overscroll-contain`
- `WebkitOverflowScrolling: 'touch'`

## 需要修复的页面

| 页面 | 文件路径 | 当前状态 |
|:----|:--------|:--------|
| 设置 | `src/pages/Settings.tsx` | 使用 `min-h-screen`，无 overflow |
| 合伙人中心 | `src/pages/Partner.tsx` | 使用 `min-h-screen`，无 overflow |
| 联系客服 | `src/pages/CustomerSupport.tsx` | 使用 `min-h-screen`，内部高度固定 |

## 修复方案

### 1. Settings.tsx
**修改前**：
```tsx
<div className="min-h-screen bg-gradient-to-br from-healing-cream...">
```

**修改后**：
```tsx
<div 
  className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-healing-cream..."
  style={{ WebkitOverflowScrolling: 'touch' }}
>
```

### 2. Partner.tsx
**修改前**：
```tsx
<div className="min-h-screen bg-gradient-to-br from-orange-50...">
```

**修改后**：
```tsx
<div 
  className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-orange-50..."
  style={{ WebkitOverflowScrolling: 'touch' }}
>
```

### 3. CustomerSupport.tsx
**修改前**：
```tsx
<div className="min-h-screen bg-gradient-to-b from-teal-50...">
  ...
  <div className="...h-[calc(100vh-60px)]">
```

**修改后**：
```tsx
<div 
  className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-teal-50..."
  style={{ WebkitOverflowScrolling: 'touch' }}
>
  ...
  <div className="...h-[calc(100dvh-60px)]">
```

## 技术说明

### 为什么 min-h-screen 在移动端会失效？

1. **全局 100dvh 锁定**：项目可能有全局样式或 Radix UI 组件设置了 `overflow: hidden`，阻止默认滚动
2. **WebKit 触摸滚动**：iOS Safari 需要显式设置 `-webkit-overflow-scrolling: touch` 才能启用惯性滚动
3. **overscroll-contain**：防止滚动穿透到父容器，避免意外关闭页面

### 统一标准
根据项目 Memory 记录，正确的滚动容器模式为：
```tsx
<div 
  className="h-screen overflow-y-auto overscroll-contain"
  style={{ WebkitOverflowScrolling: 'touch' }}
>
  <PageHeader title="..." />
  <div className="container ...">
    {/* 页面内容 */}
  </div>
</div>
```

## 文件修改清单

| 文件 | 修改类型 |
|:----|:--------|
| `src/pages/Settings.tsx` | 更新外层容器样式 |
| `src/pages/Partner.tsx` | 更新外层容器样式 |
| `src/pages/CustomerSupport.tsx` | 更新外层容器样式 + 内部高度计算 |

