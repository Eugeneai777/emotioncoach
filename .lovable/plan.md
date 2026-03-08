

## Living Lab 深色背景设计优化方案

### 整体方向
将页面从浅色背景切换为**深色沉浸式背景**（深灰/近黑），所有文字、卡片、入口相应适配，营造高级感与舒适感。

### 改动细节

#### 1. `LivingLab.tsx` — 深色页面背景
- 页面容器改为 `bg-gradient-to-b from-zinc-950 via-neutral-900 to-zinc-950`，全页深色
- PageHeader 标题文字改为白色
- 折叠触发器文字适配浅色 `text-zinc-400`
- 返回按钮适配浅色

#### 2. `SuperEntry.tsx` — 语音卡片 + 四入口适配深色
- **语音卡片**：保持红色渐变，但增加微妙的边框 `border border-white/10`，圆角保持，装饰光圈更柔和（用 framer-motion 替代 animate-ping，呼吸感更慢更舒服）
- **问候语**保持浅色，底部文案改为更温暖的「随时开口，我在」
- **四入口**：文字从 `text-foreground` 改为 `text-white`，副标题 `text-zinc-400`；图标卡片保持渐变色不变，阴影增强在深色下的发光效果

#### 3. `QuickNavFooter.tsx` — 深色适配
- 标题改为 `text-zinc-300`
- 图标下方文字改为 `text-zinc-500`
- 图标卡片增加 `bg-white/5 backdrop-blur` 毛玻璃底色

### 改动文件
- `src/pages/LivingLab.tsx`
- `src/components/living-lab/SuperEntry.tsx`
- `src/components/living-lab/QuickNavFooter.tsx`

