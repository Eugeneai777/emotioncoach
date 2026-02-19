
# GameProgressCard 优化方案

## 问题诊断（结合截图）

### 问题 1：分数文字与背景撞色（最严重）
当前：卡片背景 `from-amber-50/80 to-yellow-50/30`（浅黄色），而分数"78"和等级 badge 均使用 `text-yellow-400`/`bg-yellow-500/20`（黄色系）。

结果：**黄色文字在浅黄背景上对比度极低，78分几乎看不清**。

awakeningStates 配置中：
- 稳步觉醒（60-79分）：`text-yellow-400`、`bg-yellow-500/20`
- 这两种颜色在浅黄背景上完全"消失"

### 问题 2：里程碑轨道图标过小且缺乏信息
- 6个图标 `w-6 h-6 sm:w-8 sm:h-8`，在移动端只有 24px，挤在一行里很拥挤
- 未完成的等级图标（⭐🌟👑）用 `bg-amber-100` 背景，在浅黄卡片上几乎看不出来
- 用户无法知道每个里程碑对应什么分数目标/需要什么积分，缺少信息引导
- 当前等级下方显示 name，但其他等级没有任何标注

### 问题 3：卡片背景与页面背景融合
页面背景本身也是浅色调，整个卡片"融进"了页面，缺乏视觉边界感。

---

## 优化方案

### 修改一：提高分数区域对比度

**核心改变**：将分数"78"从动态颜色（黄色）改为固定高对比度颜色，在浅黄背景上清晰可见。

```tsx
// 改前：颜色随状态变化，在黄色背景上不可见
<span className={`text-2xl font-bold ${currentState.color}`}>

// 改后：固定使用深色 foreground，确保对比度，然后在旁边用 badge 展示状态颜色
<span className="text-3xl font-black text-amber-900 dark:text-amber-100">
```

同时将状态 badge 的颜色方案调整为更高对比度：
- 觉醒起步（红）：`bg-red-100 border-red-300 text-red-700`（在黄色背景上红色清晰可见）
- 初步觉醒（橙）：`bg-orange-100 border-orange-300 text-orange-700`
- 稳步觉醒（琥珀）：`bg-amber-200 border-amber-400 text-amber-800`（加深到能对比）
- 高度觉醒（绿）：`bg-emerald-100 border-emerald-300 text-emerald-700`

### 修改二：重新设计里程碑轨道——添加目标分数标注

将当前"6个小图标一行"的极简轨道，改为"图标 + 积分标注"的清晰里程碑样式：

**新布局**（关键改变）：
- 图标尺寸：`w-9 h-9 sm:w-10 sm:h-10`（适当放大）
- 图标下方显示等级名称（全部等级，不只是当前等级）
- 图标下方再加一行积分（如 "100分" "300分"），让用户知道目标
- 未完成的图标改为 `bg-white/80 border border-amber-200`（白色背景，与卡片浅黄区分）
- 当前等级用 `ring-2 ring-amber-500 shadow-md` 突出

**具体标注内容**（来自 awakeningLevels 配置）：
```
🌱        🌿        🌻        ⭐        🌟        👑
探索者    学徒      觉醒者    转化者    觉醒师    大师
0分       100分     300分     700分     1500分    5000分
```

### 修改三：增强卡片边界感

**当前问题**：`border border-amber-200/50` 颜色太浅，卡片与页面背景融合。

**改法**：
- 加强边框：`border border-amber-300/70 dark:border-amber-700/50`
- 或切换背景为更白的底色：`bg-white/95 dark:bg-gray-900/90`（只保留顶部装饰条的颜色标识）

考虑到整体统一方向是"白底+彩色装饰条"，建议将背景改为 `bg-white/95`，彻底解决颜色融合问题，同时分数文字用深色更清晰。

### 修改四：添加"需要X积分"的目标引导文字

当前的 "距 Lv.4 信念转化者 还需 195 积分" 已经是好的设计，但可以增强：
- 在目标积分旁边加小字说明解锁条件（如 "完成训练营后解锁"）
- 参考 `unlockCondition` 字段

---

## 修改文件与代码变更

### 唯一修改文件：`src/components/wealth-camp/GameProgressCard.tsx`

**改动 1**：`awakeningStates` 颜色配置（约第29-33行）
```tsx
// 改前（低对比度，在黄色背景上不可见）
{ emoji: '🟡', label: '稳步觉醒', ..., color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/50' }

// 改后（高对比度）
{ emoji: '🟡', label: '稳步觉醒', ..., color: 'text-amber-800 dark:text-amber-200', bg: 'bg-amber-200/80 border-amber-400' }
```

**改动 2**：分数数字样式（约第157-164行）
```tsx
// 改前
<span className={`text-2xl font-bold ${currentState.color}`}>{progress.current_awakening}</span>

// 改后：固定深色，更大，更突出
<span className="text-3xl font-black text-amber-900 dark:text-amber-100">{progress.current_awakening}</span>
```

**改动 3**：卡片背景改为白底（约第119-122行）
```tsx
// 改前
"bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-yellow-50/30 ..."

// 改后
"bg-white/95 dark:bg-gray-900/90 border border-amber-200/60 dark:border-amber-800/40 ..."
```

**改动 4**：里程碑轨道重写（约第237-323行）
- 图标改为 `w-9 h-9`
- 未完成的图标背景改为 `bg-white border border-amber-200`（而非 `bg-amber-100`）
- 每个图标下方：当前等级显示 name（橙色加粗），其他等级显示简短名称（灰色小字）
- 每个图标下方再加积分标注（如 "0积分" "100积分"），用极小文字 `text-[9px]`

---

## 视觉效果预览

**改前**：
```
[黄色背景卡片]
[🟡 稳步觉醒]  黄色"78"分（几乎看不见）
[浅黄7天目标区]
[6个微小图标，挤在一行，缺信息]
```

**改后**：
```
[琥珀顶部装饰条]
[白色背景卡片，清晰边界]
[🟡 稳步觉醒（深琥珀badge）]  黑色粗体"78"分（清晰醒目）  +33成长
[浅黄7天目标区，已达成进度条]
[较大图标轨道]
  🌱    🌿   🌻🔆   ⭐    🌟    👑
 探索者 学徒 觉醒者 转化者 觉醒师 大师
 0积分 100  300   700  1500  5000
 ✓     ✓   当前
[距 Lv.4 信念转化者 还需 195 积分 · 完成训练营后解锁]
```

总改动约 **50-60行**，全部在 `GameProgressCard.tsx` 内，不涉及其他文件。
