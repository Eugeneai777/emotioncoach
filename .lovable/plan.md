

## "温暖有机"风格重设计方案

用户选择了**温暖有机**方向：柔和圆角、暖色渐变、手绘质感，像疗愈类生活方式App。

### 设计语言变化

当前是冷调深色（zinc-950），需要转变为：
- **背景**：深暖色调，从纯黑冷灰变为带暖意的深棕/深酒红底色
- **卡片**：柔和的暖色渐变，大圆角（rounded-3xl），半透明暖色叠层
- **文字**：从冷白变为暖白/米白色调
- **四入口**：从硬边彩色方块变为柔和暖色调卡片，圆角更大
- **整体节奏**：更大间距，更慢的动画，呼吸感

### 具体改动

#### 1. `LivingLab.tsx`
- 背景改为暖色深调：`from-stone-950 via-stone-900 to-amber-950/30`
- PageHeader 文字用暖白 `amber-50`
- 折叠触发器用 `text-stone-400`

#### 2. `SuperEntry.tsx` — 语音卡片
- 卡片背景从硬红渐变改为**柔和暖粉**：`from-rose-500/90 via-amber-600/80 to-rose-400/90`
- 圆角加大到 `rounded-[32px]`
- 装饰光圈换为暖色模糊光斑（amber/rose），更大更柔
- 语音按钮改为**暖米白底色**，图标用柔和的 rose-400
- 问候语用 `amber-100`
- 底部文案字体稍大，用 `rose-200/70`

#### 3. `SuperEntry.tsx` — 四入口
- 渐变色调整为暖色系：rose、amber、teal（保留自然感）、warm-purple
- 图标容器圆角加大 `rounded-[20px]`
- 文字用 `stone-200` 和 `stone-400`
- 去掉硬阴影，改为柔和的 `shadow-sm`

#### 4. `QuickNavFooter.tsx`
- 图标容器改为暖色毛玻璃 `bg-amber-50/5 backdrop-blur-sm border-amber-200/10`
- 标题用 `stone-300`，标签用 `stone-500`

### 改动文件
- `src/pages/LivingLab.tsx`
- `src/components/living-lab/SuperEntry.tsx`
- `src/components/living-lab/QuickNavFooter.tsx`

