
# SCL-90 页面设计与排版优化方案

## 一、当前问题分析

通过审查 SCL-90 系统的 17 个组件文件，发现以下设计与排版问题：

### 1. 开始页 (SCL90StartScreen.tsx)
- ✅ 已使用 Accordion 折叠次要信息
- ⚠️ 10因子维度标签视觉层次较弱，缺少分组
- ⚠️ 评分说明区域与 CTA 按钮间距过近

### 2. 答题页 (SCL90Questions.tsx)
- ✅ 已优化为 5 列网格布局
- ⚠️ 顶部进度条与页码信息视觉权重相近，缺乏主次
- ⚠️ 当前页/总页数展示方式较朴素

### 3. 付费墙页 (SCL90PaymentGate.tsx)
- ⚠️ 模糊预览区缺少情感化设计元素
- ⚠️ 功能特性列表使用纵向排列，信息密度较低
- ⚠️ 价格区域缺少紧迫感视觉元素

### 4. 结果页 (SCL90Result.tsx)
- ⚠️ 仪表盘 (SeverityGauge) 与因子雷达图间缺少过渡
- ⚠️ 高分因子警告卡片视觉冲击力不足
- ⚠️ AI 分析部分内容较长，缺少章节导航

### 5. 因子雷达图 (SCL90FactorRadar.tsx)
- ⚠️ 因子列表使用简单纵向排列，视觉单调
- ⚠️ 雷达图标签字体较小 (10px)，在小屏幕可能难读
- ⚠️ 进度条颜色编码可进一步强化

### 6. 历史页 (SCL90HistoryPage.tsx)
- ⚠️ 统计概览卡片信息展示较基础
- ⚠️ Tab 栏图标与文字的组合在小屏幕较拥挤

## 二、优化方案

### 阶段1：视觉层次与信息分组优化

#### 1.1 开始页布局调整
```text
当前布局:
┌────────────────────────────────────┐
│       SCL-90 心理健康自评            │
│  怎么判断是焦虑还是心情烦？         │
├────────────────────────────────────┤
│  [继续答题提示卡片]                 │
├────────────────────────────────────┤
│  [核心卖点 2x2 网格]                │
├────────────────────────────────────┤
│  [10因子标签 - 平铺]                │
├────────────────────────────────────┤
│  [折叠 Accordion x3]               │
├────────────────────────────────────┤
│  [评分说明 1-5]                     │
│  ⚠️ 免责声明                        │
│  [开始测评按钮]                     │
└────────────────────────────────────┘

优化后:
┌────────────────────────────────────┐
│       SCL-90 心理健康自评            │
│  怎么判断是焦虑还是心情烦？         │
│  专业自测，清楚了解自己的情绪状态   │
├────────────────────────────────────┤
│ ┌──────────────────────────────┐   │
│ │ [继续答题提示 - 强调设计]    │   │
│ └──────────────────────────────┘   │
├────────────────────────────────────┤
│ ┌ 核心亮点 Card ─────────────────┐ │
│ │ 📊 90题·10维度  ⏱️ 经典40年     │ │
│ │ 🎯 专业可靠    🛡️ 独立评分     │ │
│ │                                 │ │
│ │ 10大心理因子：                  │ │
│ │ ┌────┐┌────┐┌────┐┌────┐┌────┐ │ │
│ │ │躯体││强迫││人际││抑郁││焦虑│ │ │
│ │ └────┘└────┘└────┘└────┘└────┘ │ │
│ │ ┌────┐┌────┐┌────┐┌────┐┌────┐ │ │
│ │ │敌对││恐怖││偏执││精神││其他│ │ │
│ │ └────┘└────┘└────┘└────┘└────┘ │ │
│ └─────────────────────────────────┘ │
├────────────────────────────────────┤
│  [折叠 Accordion - 更紧凑间距]      │
├────────────────────────────────────┤
│  评分指南（横向展示 + 渐变背景）    │
│  [1没有] [2很轻] [3中等] [4偏重] [5严重] │
├────────────────────────────────────┤
│  ╔════════════════════════════════╗ │
│  ║     🧠 开始测评                ║ │
│  ╚════════════════════════════════╝ │
│        查看历史记录 →               │
│                                     │
│  ⚠️ 免责声明（最底部）              │
└────────────────────────────────────┘
```

**修改要点：**
- 将核心卖点与10因子合并为单个 Card，减少视觉分割
- 10因子改为 2 行 x 5 列网格，视觉更整齐
- 评分说明添加渐变背景增强区分度
- 免责声明移至最底部，不占用 CTA 前空间
- Accordion 间距从 `mt-2` 改为 `mt-1.5`

#### 1.2 答题页增强进度可视化
```text
当前顶部:
[退出]                     第 1 页 / 10 页
[───────────────────────────────────────]
              已完成 0 / 90 题

优化后:
[退出]       [●○○○○○○○○○] 1/10       [跳转]
[═══════════════════════════════════════]
0%                                      100%
              已答 9 题，还剩 81 题
```

**修改要点：**
- 页码改为圆点进度指示器，点击可跳转
- 进度条增加渐变色（绿→黄→橙→红）
- 底部显示剩余题数而非已完成数（心理激励）

#### 1.3 结果页模块化分区
```text
优化后结构:
┌────────────────────────────────────┐
│ 🧠 SCL-90 心理健康评估              │
│   [仪表盘 - GSI 得分]              │
│   [严重程度徽章]                   │
│   [三项指标网格]                   │
└────────────────────────────────────┘
         ↓ 平滑过渡分隔线 ↓
┌────────────────────────────────────┐
│ 📌 关注要点                         │
│   [主要因子卡片 - 全宽]            │
│   [高分因子警告 - 标签形式]         │
└────────────────────────────────────┘
         ↓ 平滑过渡分隔线 ↓
┌────────────────────────────────────┐
│ 📊 10因子雷达分析                   │
│   [可交互雷达图]                   │
│   [因子列表 - 可展开详情]          │
└────────────────────────────────────┘
         ↓ 平滑过渡分隔线 ↓
┌────────────────────────────────────┐
│ ✨ AI 个性化解读                    │
│   [带章节导航的分析内容]           │
└────────────────────────────────────┘
```

### 阶段2：组件级优化

#### 2.1 SCL90StartScreen.tsx 修改

**文件位置：** `src/components/scl90/SCL90StartScreen.tsx`

**修改点1：合并核心卖点与因子标签 (第125-150行)**

将原本分离的核心卖点 Card 和 10因子标签合并为单个卡片，使用 2 行网格展示因子：

```tsx
{/* 核心卖点 + 10因子维度 - 合并卡片 */}
<Card className="border-purple-200/50 dark:border-purple-800/50 shadow-sm">
  <CardContent className="p-4 space-y-3">
    {/* 4个核心卖点 - 保持2x2网格 */}
    <div className="grid grid-cols-2 gap-2">
      {features.map((item, index) => (...))}
    </div>
    
    {/* 分隔线 */}
    <div className="border-t border-dashed border-purple-200/50 dark:border-purple-700/50" />
    
    {/* 10因子 - 2行5列网格 */}
    <div>
      <p className="text-xs text-muted-foreground text-center mb-2">覆盖10大心理因子</p>
      <div className="grid grid-cols-5 gap-1.5">
        {dimensions.map(f => (
          <div 
            key={f.name}
            className="flex flex-col items-center justify-center p-1.5 bg-muted/30 rounded-lg"
          >
            <span className="text-base">{f.emoji}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{f.name}</span>
          </div>
        ))}
      </div>
    </div>
  </CardContent>
</Card>
```

**修改点2：评分说明区域增强 (第222-240行)**

添加渐变背景使其更具视觉层次：

```tsx
{/* 评分说明 - 带渐变背景 */}
<div className="space-y-2 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
  <p className="text-xs text-muted-foreground text-center">
    根据<strong className="text-foreground">最近一周</strong>感受选择：
  </p>
  <div className="flex justify-between gap-1">
    {scl90ScoreLabels.map(s => (
      <div 
        key={s.value} 
        className={cn(
          "flex-1 flex flex-col items-center py-1.5 rounded-lg text-center border",
          s.color
        )}
      >
        <span className="text-sm font-bold">{s.value}</span>
        <span className="text-[10px]">{s.label}</span>
      </div>
    ))}
  </div>
</div>
```

**修改点3：调整底部 CTA 区域 (第247-277行)**

免责声明移至按钮下方，减少视觉干扰：

```tsx
{/* CTA 按钮区域 */}
<div className="space-y-3 pt-2">
  <Button ...>开始测评</Button>
  {onViewHistory && (
    <Button variant="ghost" ...>查看历史记录</Button>
  )}
  {/* 免责声明移至最后 */}
  <p className="text-[10px] text-muted-foreground text-center px-4">
    ⚠️ 本量表仅供自我筛查参考，不能替代专业心理诊断
  </p>
</div>
```

#### 2.2 SCL90Questions.tsx 修改

**文件位置：** `src/components/scl90/SCL90Questions.tsx`

**修改点1：优化顶部进度区域 (第123-145行)**

添加圆点页码指示器和渐变进度条：

```tsx
{/* 顶部导航 + 进度 */}
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <Button variant="ghost" size="sm" onClick={handleExitClick}>
      <X className="w-4 h-4" />
      退出
    </Button>
    
    {/* 圆点页码指示器 */}
    <div className="flex items-center gap-1">
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={cn(
            "w-2 h-2 rounded-full transition-all",
            i === currentPage 
              ? "bg-primary w-4" 
              : i < currentPage && Object.keys(answers).length >= (i + 1) * QUESTIONS_PER_PAGE
                ? "bg-primary/50"
                : "bg-muted"
          )}
        />
      ))}
    </div>
    
    <span className="text-xs text-muted-foreground tabular-nums">
      {currentPage + 1}/{totalPages}
    </span>
  </div>
  
  {/* 渐变进度条 */}
  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
    <motion.div
      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-primary"
      initial={{ width: 0 }}
      animate={{ width: `${progressPercent}%` }}
      transition={{ duration: 0.3 }}
    />
  </div>
  
  <p className="text-xs text-muted-foreground text-center">
    还剩 <strong className="text-foreground">{90 - answeredCount}</strong> 题
  </p>
</div>
```

#### 2.3 SCL90FactorRadar.tsx 修改

**文件位置：** `src/components/scl90/SCL90FactorRadar.tsx`

**修改点：因子列表改为可展开详情 (约第80-130行)**

使用 Accordion 包裹每个因子，点击可查看详细说明和建议：

```tsx
{/* Factor Score List - 可展开详情 */}
<Accordion type="single" collapsible className="space-y-1.5">
  {sortedFactors.map((factor, idx) => (
    <AccordionItem 
      key={factor.key} 
      value={factor.key}
      className="border-0"
    >
      <AccordionTrigger className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-colors hover:no-underline",
        factor.isPrimary && "bg-red-50 dark:bg-red-950/30",
        factor.isSecondary && "bg-orange-50 dark:bg-orange-950/30",
        !factor.isPrimary && !factor.isSecondary && "bg-muted/30"
      )}>
        {/* 图标 + 名称 + 进度条 + 分数 */}
        ...保持原有内容...
      </AccordionTrigger>
      
      <AccordionContent className="px-3 pt-2 pb-3">
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">{factor.info.description}</p>
          <p className="text-xs">
            <span className="text-muted-foreground">正常范围：</span>
            <span className="font-medium">{factor.info.normalRange}</span>
          </p>
          {factor.score >= 2.0 && (
            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs text-amber-700 dark:text-amber-300">
              💡 建议：关注此维度的调适方法，必要时寻求专业帮助
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

#### 2.4 SCL90PaymentGate.tsx 修改

**文件位置：** `src/components/scl90/SCL90PaymentGate.tsx`

**修改点1：功能特性改为紧凑布局 (第147-178行)**

```tsx
{/* 完整报告包含 - 2x2 网格 */}
<Card>
  <CardContent className="p-4">
    <h3 className="font-semibold mb-3 flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-primary" />
      解锁后获得
    </h3>
    <div className="grid grid-cols-2 gap-2">
      {features.map((feature, index) => (
        <div 
          key={index}
          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
        >
          <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-xs font-medium">{feature.text}</span>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

**修改点2：价格区域增加视觉紧迫感 (第180-218行)**

```tsx
{/* 价格区域 - 增强紧迫感 */}
<Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 overflow-hidden">
  <CardContent className="p-4 relative">
    {/* 限时标签 - 绝对定位右上角 */}
    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
      限时67%OFF
    </div>
    
    <div className="flex items-end gap-2 mb-3">
      <span className="text-3xl font-bold text-primary">¥{reportPrice.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground line-through pb-1">¥29.9</span>
    </div>
    
    <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-purple-600">
      <Lock className="w-4 h-4 mr-2" />
      立即解锁完整报告
    </Button>
  </CardContent>
</Card>
```

### 阶段3：全局样式优化

#### 3.1 卡片间距统一化

在所有 SCL-90 页面中，统一使用以下间距规范：

| 元素类型 | 间距规范 |
|---------|---------|
| 主要模块间 | `space-y-4` (16px) |
| 卡片内部 | `space-y-3` (12px) |
| 列表项间 | `space-y-2` (8px) |
| 紧凑列表 | `space-y-1.5` (6px) |

#### 3.2 过渡动画优化

确保所有页面转场和元素入场动画使用统一标准：

```tsx
// 标准入场动画
initial={{ opacity: 0.01, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: "easeOut" }}
style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
```

## 三、文件修改清单

| 文件路径 | 修改类型 | 修改内容 |
|---------|---------|---------|
| `src/components/scl90/SCL90StartScreen.tsx` | 布局优化 | 合并卖点与因子、优化评分说明、调整 CTA 区域 |
| `src/components/scl90/SCL90Questions.tsx` | 进度增强 | 圆点指示器、渐变进度条、剩余题数显示 |
| `src/components/scl90/SCL90FactorRadar.tsx` | 交互增强 | 因子列表改为可展开 Accordion |
| `src/components/scl90/SCL90PaymentGate.tsx` | 转化优化 | 功能特性 2x2 布局、价格区域紧迫感 |
| `src/components/scl90/SCL90Result.tsx` | 结构优化 | 模块间添加分隔过渡 |
| `src/components/scl90/SCL90SeverityGauge.tsx` | 微调 | 统一间距规范 |

## 四、预期效果

| 优化指标 | 优化前 | 优化后 |
|---------|-------|-------|
| 开始页滚动次数 | ~3-4次 | ~1-2次 |
| 信息获取效率 | 分散 | 集中聚焦 |
| 视觉层次 | 平铺 | 主次分明 |
| 交互反馈 | 基础 | 丰富流畅 |
| 转化引导 | 普通 | 强化紧迫感 |

## 五、技术注意事项

1. **保持现有功能**：所有修改仅涉及 UI/UX，不改变业务逻辑
2. **深色模式兼容**：所有新增颜色类需包含 `dark:` 变体
3. **动画性能**：保持 `opacity: 0.01` 和 GPU 加速以兼容微信小程序
4. **触摸优化**：保持 `min-h-[52px]` 的触摸目标标准
5. **响应式设计**：使用 `sm:` 断点适配平板设备
