
# 觉察日记页面设计统一化方案

## 当前问题诊断

通过代码分析和截图对比，发现以下设计不一致问题：

### 问题 1：卡片视觉风格割裂（最严重）
- **6个入口卡片**（AwakeningEntryCard）：使用高饱和度全渐变背景（红/琥珀/蓝/紫/粉/青），强调游戏化感
- **痛点共鸣卡片**（AwakeningPainPointCard）：使用灰色系 `from-slate-50 to-gray-100`，是完全不同的调性
- **Hero标语**（AwakeningHeroCard）：纯文字无卡片容器，视觉上"浮"在页面中

三种不同的卡片风格放在同一个页面，没有统一的设计语言。

### 问题 2：痛点卡片与Tips卡片内容重复
`AwakeningPainPointCard` 展开后包含"写法小贴士"（感谢、行动建议），与 `AwakeningTipsCard` 内容高度重叠。但 `AwakeningTipsCard` 本身又没有出现在 `Awakening.tsx` 中（已被内联到 PainPointCard），造成组件责任混乱。

### 问题 3：分区标签缺乏视觉层级
"🔥 困境 → 破局关键点"和"✨ 顺境 → 滋养与锚定"只是文字+横线，与周围浓烈的卡片颜色相比，视觉层级太弱——用户不容易快速理解两个区域的差异。

### 问题 4：入口卡片信息密度不足
compact 模式下（`min-h-[120px]`），3列网格每张卡实际高度受限，但代码中还写了 emoji、标题、categoryLabel 三层信息。在小屏上容易拥挤，且所有6张卡都用白字，没有色彩上的"困境 vs 顺境"差异。

---

## 设计方案：统一到"轻暖质感"风格

目标：从"游戏化App"调整为"高端冥想日记"——降低饱和度，统一卡片容器，建立清晰层级。

### 核心设计规范（与截图中成长档案页面保持一致）
- 卡片背景：`bg-white/90 dark:bg-gray-900/80`
- 左侧4px彩色强调条：`border-l-4 border-{color}-400`（区分各维度）
- 圆角：`rounded-xl`（统一）
- 阴影：`shadow-sm`（轻量）
- 页面背景：保持现有 `bg-gradient-to-br from-background via-background to-muted/30`

---

## 具体修改方案

### 修改一：`AwakeningHeroCard.tsx` — 加入卡片容器

**当前**：纯文字居中，无容器

**改为**：带轻渐变背景的卡片，增加数据徽章

```
┌─────────────────────────────────────────────────────┐
│  ✨ 频繁记录自己，可以改命                           │
│     这不是玄学，是神经科学                          │
│                                                     │
│  [6个觉察维度]  [每日5分钟]  [改变神经回路]         │
└─────────────────────────────────────────────────────┘
```
- 背景：`bg-gradient-to-br from-amber-50/80 to-orange-50/50`
- 下方三个小徽章用 `bg-amber-100/60 text-amber-700 rounded-full px-2 py-0.5 text-xs`

### 修改二：`AwakeningEntryCard.tsx` — 重设compact模式样式

**当前**：全渐变彩色背景 + 白字，`min-h-[120px]`

**改为**：白色背景 + 左彩色强调条 + 深色文字，`min-h-[90px]`，减小尺寸

```
┌─┬─────────────────────────┐
│█│ 🔥 情绪                  │
│█│ 看见被忽略的信号          │
│█│ → 困境                   │
└─┴─────────────────────────┘
```

各维度的彩色条颜色（对应 awakeningConfig 中的 primaryColor）：
- 情绪（红）：`border-l-red-400 bg-red-50/30`
- 感恩（琥珀）：`border-l-amber-400 bg-amber-50/30`  
- 行动（蓝）：`border-l-blue-400 bg-blue-50/30`
- 选择（紫）：`border-l-purple-400 bg-purple-50/30`
- 关系（粉）：`border-l-pink-400 bg-pink-50/30`
- 方向（绿）：`border-l-teal-400 bg-teal-50/30`

每张卡内部：
- emoji 独立一行，`text-2xl mb-1`
- 标题：`text-sm font-bold text-foreground`
- categoryLabel：`text-[10px] text-muted-foreground`

同时保留 hover 效果：`hover:shadow-md hover:-translate-y-0.5 transition-all`

### 修改三：`AwakeningPainPointCard.tsx` — 去掉重复的Tips内容，视觉统一

**当前**：灰色系背景，展开后包含写法小贴士（与TipsCard重复）

**改为**：
- 背景改为淡紫/蓝 `from-violet-50/50 to-blue-50/30 dark:from-violet-900/10 dark:to-blue-900/10`
- 展开后**移除**"写法小贴士"部分（减少重复）
- 折叠状态显示文案改为：`✨ 你是否也在「自动驾驶」？`
- 配合痛点内容保留，末尾金句保留

### 修改四：`Awakening.tsx` — 优化分区标签视觉

**当前**：文字+横线分隔，视觉较弱

**改为**：药丸形状标签，有背景色

困境区：
```
[🔥 困境 → 破局关键点]（bg-red-50/80 text-red-600 border border-red-200 rounded-full px-3 py-1）
```

顺境区：
```
[✨ 顺境 → 滋养与锚定]（bg-emerald-50/80 text-emerald-600 border border-emerald-200 rounded-full px-3 py-1）
```

两侧横线改为淡色，对比减弱（让标签本身作为视觉焦点）：
`bg-border/30` 代替 `via-destructive/30`

---

## 修改文件清单

| 文件 | 修改内容 | 改动量 |
|------|---------|--------|
| `src/components/awakening/AwakeningHeroCard.tsx` | 添加 Card 容器 + 三个数据徽章 | ~20行 |
| `src/components/awakening/AwakeningEntryCard.tsx` | 重写 compact 模式样式（白底+彩色强调条） | ~30行 |
| `src/components/awakening/AwakeningPainPointCard.tsx` | 改背景色 + 删除重复Tips内容 | ~15行 |
| `src/pages/Awakening.tsx` | 分区标签改为药丸样式 | ~10行 |

**不修改**：`awakeningConfig.ts`（保留 primaryColor 字段，新方案使用它来决定左侧强调条颜色）、`AwakeningBottomNav.tsx`、`AwakeningDrawer.tsx`

## 视觉效果对比

**改前（当前状态）**：
- Hero 纯文字漂浮 → 痛点卡（灰色）→ 红色分隔线 → 3张高饱和红/黄/蓝卡片 → 绿色分隔线 → 3张高饱和紫/粉/青卡片

**改后（统一状态）**：
- Hero 暖色卡片（琥珀渐变容器）→ 紫蓝调痛点卡 → 红色药丸标签（白底） → 3张白底红/黄/蓝强调条卡片 → 绿色药丸标签（白底） → 3张白底紫/粉/青强调条卡片

整体调性从「高饱和游戏化」统一到「轻暖质感冥想风」，与截图中成长档案页面（白底卡片）的设计语言保持一致。
