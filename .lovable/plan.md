

## 优化6个人群入口按钮设计

### 现状
当前6个按钮是3x2网格，每个按钮使用纯渐变背景+居中emoji+白色文字，视觉上较为扁平单调，缺乏小程序首页的精致感。

### 优化方案（仅改 `src/pages/MiniAppEntry.tsx`）

**1. 卡片视觉升级**
- 增大卡片高度（`min-h-[96px]`），给内容更多呼吸空间
- 添加顶部高光层（`bg-gradient-to-b from-white/25 via-transparent to-black/5`），模拟3D立体质感
- 右上角emoji改为更大的装饰水印（`text-3xl opacity-20`），营造品牌氛围

**2. 图标容器化**
- emoji放入半透明圆形容器（`w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm`）
- 增加微弱的内阴影，提升精致度

**3. 文字层次强化**
- 标题加粗加大（`text-[15px] font-extrabold`）
- 副标题使用 `text-white/80` 提高可读性，字间距略增

**4. 交互反馈**
- 添加按压时的内凹效果（`active:shadow-inner`）
- hover 时微微上浮（`hover:-translate-y-0.5`）

**5. 整体布局微调**
- 网格间距从 `gap-1.5` 增大到 `gap-2`
- 外边距 `px-3` 改为 `px-4` 与页面其他区域对齐
- 卡片圆角加大到 `rounded-2xl`

### 预期效果
参照截图中的饱和渐变+立体感卡片风格，6个按钮更像"入口卡片"而非"平面按钮"，每个卡片有明确的视觉层次和品牌感。

