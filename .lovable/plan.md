

# 优化产品中心训练营卡片设计和排版

## 当前问题分析

从截图可以看到以下问题：

| 问题 | 描述 |
|:-----|:-----|
| 卡片背景 | 使用的是 gradient 但效果不够突出，颜色有些"脏" |
| 布局松散 | 内容间距过大，视觉密度低 |
| 按钮并排拥挤 | "立即报名"和"了解更多"按钮挤在一行，比例不协调 |
| benefits标签 | 标签太多且被截断，右侧还有个多余的图标（🚀） |
| 价格显示 | 原价划线和现价的对比不够醒目 |
| 整体风格 | 与 `/camp-list` 页面的精美卡片风格不统一 |

## 设计优化方案

### 1. 卡片整体布局调整

**新布局结构**（垂直居中，更紧凑）：
```
┌──────────────────────────────────┐
│          [渐变背景区]             │
│                                  │
│            📝 (icon大)            │
│        21天情绪日记训练营          │
│    每天记录情绪，积累成长力量       │
│                                  │
│   [标签1] [标签2] [标签3] (可选)   │
│                                  │
│     ¥399  ¥299  [限时优惠]        │
│                                  │
│  ┌─────────────────┐ ┌────────┐ │
│  │   🛒 立即报名    │ │了解更多│ │
│  └─────────────────┘ └────────┘ │
└──────────────────────────────────┘
```

### 2. 具体样式优化

| 元素 | 当前 | 优化后 |
|:-----|:-----|:------|
| 卡片背景 | `bg-gradient-to-br` 渐变 | 使用更柔和的渐变 + 白色覆盖层提升可读性 |
| 图标 | `text-4xl` | 保持但添加 drop-shadow |
| 标题 | `text-xl font-bold` | 添加文字阴影增强对比 |
| 副标题 | 普通 muted 颜色 | 使用白色/浅色更清晰 |
| Benefits | 全部显示 | 最多显示3个，超出用省略号 |
| 价格区 | 左右排列 | 居中显示，原价+现价+标签一行 |
| 按钮 | flex gap-2 挤在一行 | "立即报名"占主要宽度，"了解更多"用outline样式 |

### 3. 颜色和渐变优化

为每个训练营使用更协调的渐变方案：

```css
/* 情绪日记 - 紫粉渐变 */
from-purple-500/90 via-pink-500/80 to-purple-600/90

/* 青少年困境突破 - 紫色渐变 */  
from-indigo-500/90 via-purple-500/80 to-violet-600/90

/* 财富觉醒 - 金色渐变 */
from-amber-500/90 via-orange-500/80 to-yellow-500/90
```

添加半透明白色覆盖层确保文字可读性。

## 技术实现

### 修改文件：`src/components/ProductComparisonTable.tsx`

#### 改动范围：第393-466行（youjin-camp 渲染部分）

**主要改动：**

1. **卡片容器**
```tsx
<MobileCard 
  key={camp.id}
  noPadding
  className="overflow-hidden"
>
  {/* 渐变背景区 */}
  <div className={`bg-gradient-to-br ${camp.gradient || 'from-teal-500 to-cyan-500'} p-6 text-white`}>
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    {/* 内容... */}
  </div>
</MobileCard>
```

2. **图标和标题**
```tsx
<span className="text-5xl filter drop-shadow-lg">{camp.icon || '🎯'}</span>
<h3 className="text-xl font-bold text-white drop-shadow">{camp.camp_name}</h3>
<p className="text-sm text-white/80">{camp.camp_subtitle}</p>
```

3. **Benefits标签优化**
```tsx
{benefits.length > 0 && (
  <div className="flex flex-wrap justify-center gap-1.5 text-xs">
    {benefits.slice(0, 3).map((benefit, i) => (
      <span key={i} className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90">
        {benefit}
      </span>
    ))}
  </div>
)}
```

4. **价格区优化**
```tsx
<div className="flex items-center justify-center gap-2 flex-wrap">
  {hasOriginalPrice && (
    <span className="text-white/60 line-through text-sm">¥{formatMoney(camp.original_price)}</span>
  )}
  <span className="text-3xl font-bold text-white drop-shadow">¥{formatMoney(camp.price)}</span>
  {camp.price_note && (
    <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-medium rounded-full">
      {camp.price_note}
    </span>
  )}
</div>
```

5. **按钮区优化**
```tsx
<div className="flex gap-2 px-4 pb-4 mt-auto">
  <Button 
    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
    size="lg"
    onClick={() => handlePurchase({...})}
  >
    <ShoppingCart className="w-4 h-4 mr-1.5" />
    立即报名
  </Button>
  <Button 
    variant="outline" 
    className="bg-white/90 hover:bg-white"
    onClick={() => navigate(`/camp-template/${camp.id}`)}
  >
    了解更多
  </Button>
</div>
```

## 优化后预期效果

| 项目 | 优化前 | 优化后 |
|:-----|:------|:------|
| 视觉层次 | 平淡 | 渐变背景+白色文字，层次分明 |
| 信息密度 | 松散 | 紧凑但不拥挤 |
| 按钮布局 | 挤在一行 | 主次分明，"报名"按钮更突出 |
| 价格展示 | 不够醒目 | 大号白色字体+标签更吸引 |
| 整体风格 | 与camp-list不统一 | 风格趋于一致 |

## 文件清单

| 文件 | 操作 |
|:-----|:-----|
| src/components/ProductComparisonTable.tsx | 修改：优化youjin-camp和bloom-camp的卡片布局和样式 |

