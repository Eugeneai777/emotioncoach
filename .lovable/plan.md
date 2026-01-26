
# SCL-90 答题页面移动端体验优化计划

## 当前问题分析

通过代码审查，发现当前 SCL-90 答题页面存在以下移动端体验问题：

1. **选项按钮太小**
   - 当前使用 `px-3 py-1.5 text-xs`，按钮高度约 28-32px
   - 未达到移动端推荐的 44px 最小触摸目标
   - 在小屏幕手机上容易误触

2. **按钮布局不够紧凑**
   - 使用 `flex-wrap gap-1.5` 横向排列
   - 在窄屏幕上（<375px）5个按钮可能换行导致视觉混乱
   - `ml-10` 的左边距在小屏幕上浪费空间

3. **选中状态反馈不够明显**
   - 仅使用 `ring-2 ring-primary` 和 `scale-105`
   - 在户外光线下可能不够醒目

## 优化方案

### 1. 重新设计选项按钮布局

将 5 个选项改为更适合移动端的布局：

**方案：横向滑动 + 大触摸区域**

```text
┌───────────────────────────────────────┐
│  ① 头痛                               │
│                                       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  │
│  │ 1  │ │ 2  │ │ 3  │ │ 4  │ │ 5  │  │
│  │没有│ │很轻│ │中等│ │偏重│ │严重│  │
│  └────┘ └────┘ └────┘ └────┘ └────┘  │
└───────────────────────────────────────┘
```

- 使用 `grid grid-cols-5` 确保按钮等宽分布
- 按钮高度增加到 `min-h-[44px]` 达到触摸标准
- 数字和文字分两行显示，更易阅读

### 2. 优化题目卡片结构

**改进布局**
- 移除 `ml-10` 的左边距，利用全部宽度
- 题号改为内联显示，节省垂直空间
- 增加卡片内边距在大屏幕上的响应式调整

### 3. 增强选中状态反馈

- 选中时使用更明显的颜色填充（不只是边框）
- 添加 `touch-manipulation` 禁用双击缩放
- 选中按钮增加图标或勾选标记

### 4. 底部导航栏安全区域

- 添加 `pb-[env(safe-area-inset-bottom)]` 适配全面屏
- 使用 `backdrop-blur` 增加层次感

## 具体代码修改

### 文件：`src/components/scl90/SCL90Questions.tsx`

**修改点 1：选项按钮区域（第 181-198 行）**

将当前的 `flex-wrap` 布局改为 `grid` 布局：

```tsx
{/* 评分选项 - 优化为5列等宽网格 */}
<div className="grid grid-cols-5 gap-1.5 mt-3">
  {scl90ScoreLabels.map(option => (
    <button
      key={option.value}
      onClick={() => handleAnswer(question.id, option.value)}
      className={cn(
        "flex flex-col items-center justify-center",
        "min-h-[52px] rounded-lg border-2 transition-all duration-200",
        "touch-manipulation active:scale-95",
        answers[question.id] === option.value
          ? "ring-2 ring-offset-1 ring-primary border-primary bg-primary/10 scale-[1.02]"
          : "border-muted-foreground/20 hover:border-primary/40",
        option.color
      )}
    >
      <span className="text-sm font-bold">{option.value}</span>
      <span className="text-[10px] font-medium opacity-80">{option.label}</span>
    </button>
  ))}
</div>
```

**修改点 2：题目卡片布局（第 159-179 行）**

优化题目显示区域，移除多余边距：

```tsx
<div
  key={question.id}
  className={cn(
    "p-3 sm:p-4 rounded-xl border bg-card",
    answers[question.id] !== undefined 
      ? "border-primary/30 bg-primary/5" 
      : "border-border"
  )}
>
  {/* 题目文本 - 题号内联 */}
  <div className="flex items-start gap-2 mb-3">
    <span className={cn(
      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
      answers[question.id] !== undefined
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground"
    )}>
      {question.id}
    </span>
    <p className="text-sm font-medium leading-relaxed pt-0.5">{question.text}</p>
  </div>
  
  {/* 选项区域 */}
  ...
</div>
```

**修改点 3：底部导航按钮（第 204-238 行）**

添加安全区域和视觉优化：

```tsx
<div className="flex gap-3 pt-2 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-[calc(16px+env(safe-area-inset-bottom))]">
  ...
</div>
```

### 文件：`src/components/scl90/scl90Data.ts`

**修改点 4：更新选项颜色配置（第 144-150 行）**

增强选中态的视觉区分度：

```tsx
export const scl90ScoreLabels = [
  { value: 1, label: '没有', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { value: 2, label: '很轻', color: 'bg-sky-50 text-sky-600 border-sky-200' },
  { value: 3, label: '中等', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { value: 4, label: '偏重', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { value: 5, label: '严重', color: 'bg-rose-50 text-rose-600 border-rose-200' },
];
```

## 预期效果

| 优化项 | 优化前 | 优化后 |
|-------|-------|-------|
| 按钮高度 | ~28px | ≥52px |
| 触摸区域 | 不规则 | 等宽方形 |
| 布局 | flex-wrap 可能换行 | 固定5列网格 |
| 选中反馈 | 仅边框高亮 | 背景+边框+缩放 |
| 安全区域 | 未适配 | 适配全面屏 |

## 注意事项

- 保持与现有答题进度保存功能的兼容性
- 确保 framer-motion 动画使用 `opacity: 0.01` 避免微信小程序白屏
- 保持深色模式的兼容性
