
# 修复有劲生活馆入口页面无法滚动的问题

## 问题根因

### 全局 CSS 约束
`src/index.css` 中的全局样式锁住了文档级滚动：

```css
html { height: 100dvh; }
body { overscroll-behavior: none; }
#root { min-height: 100dvh; }
```

### 页面布局不一致
| 页面 | 当前布局 | 能否滚动 |
|------|----------|----------|
| 有劲生活馆 (`EnergyStudio.tsx`) | `h-screen overflow-y-auto overscroll-contain` | ✅ 能滚动 |
| AI教练 (`CoachSpace.tsx`) | `min-h-screen` (无 overflow-y-auto) | ❌ 不能滚动 |
| 学习课程 (`Courses.tsx`) | `min-h-screen` (无 overflow-y-auto) | ❌ 不能滚动 |
| 训练营 (`CampList.tsx`) | `min-h-screen` (无 overflow-y-auto) | ❌ 不能滚动 |
| 合伙人 (`PartnerTypeSelector.tsx`) | `min-h-screen` (无 overflow-y-auto) | ❌ 不能滚动 |

## 解决方案

将四个页面的根容器统一改为项目已有的"滚动容器标准"：

```typescript
<div 
  className="h-screen overflow-y-auto overscroll-contain ..."
  style={{ WebkitOverflowScrolling: 'touch' }}
>
```

## 修改清单

### 1. `src/pages/CoachSpace.tsx`

**第 17 行**

修改前：
```typescript
<div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-[env(safe-area-inset-bottom)]">
```

修改后：
```typescript
<div 
  className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50 to-white pb-[env(safe-area-inset-bottom)]"
  style={{ WebkitOverflowScrolling: 'touch' }}
>
```

### 2. `src/pages/Courses.tsx`

**第 219 行（主内容）和第 200 行（加载态）**

修改前：
```typescript
// 加载态
<div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">

// 主内容
<div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
```

修改后：
```typescript
// 加载态
<div 
  className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center"
  style={{ WebkitOverflowScrolling: 'touch' }}
>

// 主内容
<div 
  className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-background via-background to-accent/5"
  style={{ WebkitOverflowScrolling: 'touch' }}
>
```

### 3. `src/pages/CampList.tsx`

**第 199 行（主内容）**

修改前：
```typescript
<div className="min-h-screen bg-gradient-to-br from-teal-50/80 via-cyan-50/50 to-blue-50/30 ...">
```

修改后：
```typescript
<div 
  className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-teal-50/80 via-cyan-50/50 to-blue-50/30 ..."
  style={{ WebkitOverflowScrolling: 'touch' }}
>
```

### 4. `src/pages/PartnerTypeSelector.tsx`

**第 49 行**

修改前：
```typescript
<div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
```

修改后：
```typescript
<div 
  className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-background via-background to-primary/5"
  style={{ WebkitOverflowScrolling: 'touch' }}
>
```

## 技术细节

### 为什么 `min-h-screen` 不够？

1. **全局 `height: 100dvh`**：当 `html` 被锁定为精确高度时，`body` 和 `#root` 也被约束在这个高度内
2. **`overscroll-behavior: none`**：禁用了 iOS/Android 的弹性滚动效果，同时可能阻止某些浏览器的默认滚动行为
3. **`min-h-screen` 依赖文档滚动**：子元素超出时期望 body 产生滚动条，但 body 高度被锁死

### 标准滚动容器模式

```typescript
<div 
  className="h-screen overflow-y-auto overscroll-contain"
  style={{ WebkitOverflowScrolling: 'touch' }}
>
  {/* 内容 */}
</div>
```

- `h-screen`：固定高度为视口高度
- `overflow-y-auto`：内容超出时显示滚动条
- `overscroll-contain`：防止滚动穿透到父级
- `WebkitOverflowScrolling: 'touch'`：iOS 平滑滚动

## 预期效果

修复后，从有劲生活馆点击四个入口进入的页面都能正常上下滚动，与有劲生活馆本身的滚动体验一致。
