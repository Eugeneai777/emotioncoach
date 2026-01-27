
# 成长支持路径设计优化方案

## 现状分析

当前实现存在以下问题：
1. **视觉层次不清晰** - 所有节点使用相似的卡片样式，难以区分已完成/当前/待解锁
2. **进度感知弱** - 缺少连续的进度线，箭头连接器显得碎片化
3. **动画效果单一** - 仅有基础的 fade-in 入场动画，缺少交互反馈
4. **状态区分度低** - 已完成节点仅用 opacity:0.8 和绿色勾标识，不够醒目

## 优化目标

| 目标 | 描述 |
|------|------|
| 清晰的进度可视化 | 用连续进度线 + 节点状态 清晰展示完成情况 |
| 突出当前任务 | 让"下一步要做什么"一目了然 |
| 丰富的动画体验 | 入场动画、悬停反馈、进度线动画 |
| 移动端友好 | 符合 48px 触控标准，流畅的滚动体验 |

## 设计方案

### 1. 重构布局：垂直时间轴 + 进度线

```text
┌────────────────────────────────────┐
│  📍 当前位置：已完成测评            │
└────────────────────────────────────┘

  ●━━━━━━━━━━━━━━  组合测评 ✓         <- 已完成（绿色实心圆 + 实线）
  │                 觉察入口
  │                 ¥9.9
  │
  ●━━━━━━━━━━━━━━  AI教练 ←          <- 当前（脉冲圆 + 高亮卡片）
  │                 即时陪伴
  │                 【立即开始】
  │
  ○─ ─ ─ ─ ─ ─ ─   21天训练营          <- 待解锁（空心圆 + 虚线）
  │                 系统转化
  │                 ¥299
  │
  ○─ ─ ─ ─ ─ ─ ─   365会员             <- 待解锁
  │                 长期陪伴
  │                 ¥365
  │
  ◇              成为合伙人             <- 终极目标（钻石图标）
```

### 2. 节点状态视觉设计

| 状态 | 节点圆 | 连接线 | 卡片样式 | 动画 |
|------|--------|--------|----------|------|
| completed | 实心绿圆 + ✓ | 实线渐变（绿色） | 柔和背景 + 已完成标签 | 入场时从左滑入 |
| current | 脉冲紫圆 | 渐变过渡 | 高亮边框 + glow效果 | 呼吸动画 + 入场放大 |
| upcoming | 空心灰圆 | 虚线灰色 | 半透明 + 锁定图标 | 延迟入场 |

### 3. 动画系统

```text
入场动画序列：
┌─────────────────────────────────────────────────┐
│ 0ms    100ms   200ms   300ms   400ms   500ms    │
│  │       │       │       │       │       │      │
│  ├── 头部卡片淡入                               │
│          ├── 进度线从上往下绘制（stagger）      │
│                  ├── 节点1 弹入                 │
│                          ├── 节点2 弹入         │
│                                  ├── 节点3      │
│                                          └─ CTA │
└─────────────────────────────────────────────────┘

交互动画：
- 卡片 hover: scale(1.02) + shadow 加深
- 卡片 tap: scale(0.98) 按压反馈
- 当前节点: 边框呼吸 + 图标脉冲
- 进度线: 渐变色流动效果（可选）
```

### 4. 内容优化

| 模块 | 优化项 |
|------|--------|
| 顶部状态 | 显示完成进度百分比 (如 "25% · 已完成1/4步") |
| 已完成节点 | 显示完成时间 + 查看详情入口 |
| 当前节点 | 突出 CTA 按钮 + 预估时间/难度提示 |
| 待解锁节点 | 锁定图标 + "完成上一步后解锁" 提示 |
| 合伙人入口 | 改为横向 banner 样式，更突出 |

## 技术实现

### 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/components/growth/GrowthPathVisualization.tsx` | 重构为时间轴布局，添加进度线、节点状态动画 |
| `src/components/growth/GrowthNodeCard.tsx` | 新建组件，封装单个节点的渲染和动画逻辑 |
| `src/components/growth/GrowthProgressLine.tsx` | 新建组件，渲染连接线及其动画 |
| `src/config/growthPathConfig.ts` | 添加 completedText 等辅助文案配置 |
| `src/pages/GrowthSupportPath.tsx` | 调整容器样式适配新布局 |

### 核心代码结构

```text
GrowthPathVisualization
├── ProgressHeader (当前阶段 + 完成百分比)
├── TimelineContainer
│   ├── GrowthProgressLine (SVG 进度线 + 动画)
│   └── NodeList
│       ├── GrowthNodeCard (completed)
│       ├── GrowthNodeCard (current) ← 高亮
│       ├── GrowthNodeCard (upcoming)
│       └── GrowthNodeCard (upcoming)
├── PartnerBanner (合伙人入口)
└── MainCTA (主按钮)
```

### 动画配置（Framer Motion）

```typescript
// 入场动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const nodeVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

// 当前节点脉冲动画
const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 0 0 0 rgba(139, 92, 246, 0.4)",
      "0 0 0 8px rgba(139, 92, 246, 0)",
      "0 0 0 0 rgba(139, 92, 246, 0)"
    ],
    transition: { duration: 2, repeat: Infinity }
  }
};
```

### 进度线实现（SVG Path）

```typescript
// 进度线动画 - 从顶部绘制到当前位置
<motion.path
  d={linePath}
  stroke="url(#progressGradient)"
  strokeWidth={3}
  fill="none"
  initial={{ pathLength: 0 }}
  animate={{ pathLength: progressRatio }}
  transition={{ duration: 1.2, ease: "easeOut" }}
/>
```

## 预期效果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 进度可视化 | 依赖 badge 文字 | 进度线 + 百分比 + 节点状态 |
| 当前任务突出度 | 仅 ring 边框 | 脉冲动画 + glow + 内嵌 CTA |
| 动画丰富度 | 基础 fade-in | 时序入场 + 交互反馈 + 进度线动画 |
| 信息密度 | 重复显示价格/描述 | 根据状态差异化显示关键信息 |

## 移动端适配

- 节点卡片高度 >= 72px，满足触控需求
- 时间轴偏左布局，为内容留出更多空间
- 进度线宽度 3px，在小屏幕上清晰可见
- 动画使用 `opacity: 0.01` 和 `translateZ(0)` 确保微信 WebView 兼容
