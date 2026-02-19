
# 四张卡片设计统一化方案

## 当前设计问题分析

### 视觉割裂根因

通过代码审查，四张卡片分别使用了完全不同的视觉系统：

| 卡片 | 当前背景风格 | 文字颜色 | 调性 |
|------|------------|---------|------|
| 训练营毕业证书 | `from-emerald-50 to-teal-50/50` 浅绿渐变 | 绿色系 | 清新轻盈 |
| 我的财富觉醒之旅 | `from-slate-900 via-slate-800 to-slate-900` 深暗色 | 白色 | 游戏化/暗黑 |
| 成长曲线 | 默认 `Card`（白色无修饰）| 默认文字 | 平淡无特色 |
| 我的财富人格画像 | 默认 `Card`（白色无修饰）+ 内部彩色反应模式块 | 混合 | 内部与外部风格分裂 |

**最严重问题**：「财富觉醒之旅」的深暗色背景（Dark Gaming 风格）与其他三张浅色/白色卡片形成极大视觉跳跃，用户滚动时会产生明显的「入戏感断裂」。

---

## 设计决策

### 目标风格：「轻暖质感」统一调性

参照用户截图和 `GraduateContinueCard` 已有的白底设计，以及 `cardBaseStyles` 规范，统一到：

- 卡片背景：浅暖色渐变（而非纯黑深暗）
- 圆角：`rounded-xl`（已有标准）
- 阴影：`shadow-sm`（已有标准）
- 顶部4px彩色装饰条：区分各卡片身份

### 颜色语言：每张卡专属身份色

- **毕业证书**：保持翠绿色（`emerald`）—— 象征完成与成就
- **觉醒之旅**：琥珀/暖金色（`amber`）—— 象征财富与成长，**从暗黑改为暖光**
- **成长曲线**：紫罗兰（`violet`）—— 象征智慧与洞察
- **财富人格画像**：蓝紫色（`indigo`）—— 象征深度探索

---

## 具体修改方案

### 修改一：`AwakeningArchiveTab.tsx` — 毕业证书卡片微调

**当前**：`from-emerald-50 to-teal-50/50 border-emerald-200/50`  
**问题**：左侧圆形图标过大（`w-12 h-12`），卡片内容不够紧凑

**改为**：
- 保留翠绿调性，加上 `border-l-4 border-l-emerald-400` 左装饰条（与其他卡片风格统一）
- Trophy图标改为 `w-10 h-10` 更紧凑
- 整体背景改为 `bg-white/90 dark:bg-gray-900/80` + `border-emerald-200 dark:border-emerald-800/40`（降低饱和度）
- 顶部加一条 `h-1 bg-gradient-to-r from-emerald-400 to-teal-400` 装饰条

最终样式效果：
```
┌────────────────────────────────────────────────────┐
│░░░░ 翠绿顶部装饰条 (h-1) ░░░░░░░░░░░░░░░░░░░░░░░░│
│  🏆 训练营毕业证书              +33               │
│     2026年1月11日 毕业          觉醒成长           │
│  [ 查看完整报告 → ]                               │
└────────────────────────────────────────────────────┘
```

### 修改二：`GameProgressCard.tsx` — 财富觉醒之旅从暗黑改为暖光

**当前**：`from-slate-900 via-slate-800 to-slate-900` + 白色文字 + 游戏化设计  
**问题**：与页面其他浅色卡片形成强烈视觉撞击

**改为**：保留所有数据和交互逻辑，仅修改视觉层：
- 卡片背景：`bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-yellow-50/30 dark:from-amber-950/30 dark:via-slate-900/50 dark:to-slate-900/80`
- 文字颜色：从白色 `text-white` 改为深色 `text-foreground`/`text-amber-800`
- 所有 `text-slate-xxx` 改为 `text-muted-foreground`
- 内嵌7天目标区：从 `bg-amber-500/10 border-amber-500/20` 改为 `bg-amber-100/60 border-amber-300/50 dark:bg-amber-900/20`
- 等级轨道图标：暗色背景 `bg-slate-700` 改为 `bg-amber-100 dark:bg-amber-900/40`
- 顶部加 `h-1 bg-gradient-to-r from-amber-400 to-orange-400` 装饰条

Dark mode时回退到稍暗的暖色（`dark:from-amber-950/40`），保持深色模式可读性。

```
┌────────────────────────────────────────────────────┐
│░░░░ 琥珀顶部装饰条 (h-1) ░░░░░░░░░░░░░░░░░░░░░░░░│
│ 🎮 我的财富觉醒之旅                    (i)        │
│ [🟡 稳步觉醒]  78 分  (+33)                       │
│ ┌──────────────────────────────────────────────┐   │
│ │ 🎯 7天觉醒目标：65分              ✓ 已达成    │   │
│ │ ████████████████████████████████████████     │   │
│ │ 🎉 已达成 7 天觉醒目标！                     │   │
│ └──────────────────────────────────────────────┘   │
│ [🌱]──[🌿]──[🌻当前]──[⭐]──[⭐⭐]──[👑]          │
│     距 Lv.4 信念转化者 还需 195 积分              │
└────────────────────────────────────────────────────┘
```

### 修改三：`AwakeningArchiveTab.tsx` — 成长曲线卡片增加标识

**当前**：默认 `Card shadow-sm`，标题只是文字，无视觉特征

**改为**：
- 加顶部 `h-1 bg-gradient-to-r from-violet-400 to-purple-400` 装饰条
- CardHeader 加淡紫背景：`bg-violet-50/40 dark:bg-violet-950/20`
- 标题文字改为 `text-violet-800 dark:text-violet-200`

### 修改四：`CombinedPersonalityCard.tsx` — 财富人格画像增加标识

**当前**：默认 `Card overflow-hidden`，无视觉标识

**改为**：
- 加顶部 `h-1 bg-gradient-to-r from-indigo-400 to-violet-400` 装饰条
- CardHeader 加淡蓝背景：`bg-indigo-50/40 dark:bg-indigo-950/20`
- 标题文字改为 `text-indigo-800 dark:text-indigo-200`

---

## 修改文件清单

| 文件 | 修改内容 | 改动量 |
|------|---------|--------|
| `src/components/wealth-camp/AwakeningArchiveTab.tsx` | 毕业证书+成长曲线卡片加顶部装饰条和统一样式 | ~15行 |
| `src/components/wealth-camp/GameProgressCard.tsx` | 将暗黑背景改为暖光风格，保留所有功能和数据 | ~40行 |
| `src/components/wealth-camp/CombinedPersonalityCard.tsx` | 外层Card加顶部装饰条和Header背景 | ~8行 |

**不修改**：`WealthProgressChart.tsx`（图表内部逻辑）、`GraduateContinueCard.tsx`（只在毕业后其他页面使用）

---

## 改前 vs 改后对比

**改前（视觉冲突严重）**：
```
[浅绿色 毕业证书卡片]
[纯黑暗色 觉醒之旅卡片] ← 视觉撞击
[无修饰白色 成长曲线卡片]
[无修饰白色 人格画像卡片]
```

**改后（统一暖光调性）**：
```
[白底+翠绿顶条 毕业证书] ← 顶部1px色条作为唯一标识
[暖琥珀渐变 觉醒之旅] ← 从暗黑改为暖光，统一调性
[白底+紫色顶条 成长曲线]
[白底+蓝紫顶条 人格画像]
```

整体改动量小（~63行），不涉及任何数据逻辑变更，只修改视觉样式类名。
