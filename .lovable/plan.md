

# 有劲生活馆页面全面改版方案

将当前的列表式布局改造为小红书/抖音风格的现代化页面，涵盖视觉、布局、交互三个层面。

## 改动概览

### 1. AudienceHub → 小红书风格瀑布流卡片

**文件**：`src/components/energy-studio/AudienceHub.tsx`

- 改用 `columns-2 gap-3` CSS 瀑布流布局
- 每张卡片：大渐变封面区（交替高度制造错落感）+ 大 emoji + 白底圆角卡片
- 底部增加心形图标 + 模拟热度数据 + 标签
- 圆角 `rounded-2xl`，`shadow-md`，hover 阴影加深

```text
┌───────────┐ ┌───────────┐
│  🌸 渐变   │ │  💼 渐变   │
│  (高封面)  │ │  (矮封面)  │
│           │ │ 职场解压   │
│ 宝妈专区   │ │ 压力恢复   │
│ 陪你带娃   │ │ ❤️ 1.8k   │
│ ❤️ 2.1k   │ └───────────┘
└───────────┘ ┌───────────┐
┌───────────┐ │  🎓 渐变   │
│  💑 渐变   │ ...
```

### 2. 快捷入口 → 横向滚动胶囊

**文件**：`src/pages/EnergyStudio.tsx`

- 5 个快捷入口改为横向可滚动的胶囊按钮（`flex overflow-x-auto snap-x`）
- 隐藏滚动条，圆角渐变背景 + emoji + 文字水平排列
- 比网格更节省纵向空间，移动端友好

### 3. 工具/测评卡片 → 双列图文卡片

**文件**：`src/pages/EnergyStudio.tsx`

- 当前单列列表改为 `grid grid-cols-2 gap-3` 双列卡片
- 每张卡片顶部为渐变色区域（含图标），底部为白底文字区
- 标签（推荐/热门/新）以彩色小圆角 badge 展示在封面右上角
- 测评卡片额外显示时长信息

### 4. Tab 切换 → 小红书风格顶部标签

- "日常工具" / "专业测评" tab 改为下划线指示器样式
- 选中态：粗体 + 底部 2px 圆角指示条（`motion.div layoutId` 动画）
- 非选中态：常规字重 + 灰色

### 5. 页面整体视觉升级

**文件**：`src/pages/EnergyStudio.tsx`

- 背景改为微渐变（`bg-gradient-to-b from-rose-50/50 to-background`）
- 模块之间增加 `space-y-4` 间距
- 情绪 SOS 卡片改为突出的横幅样式（全宽渐变背景 + 白色文字）
- 所有可点击元素确保最小 44x44px 触控区域

### 6. 交互动画增强

- 卡片入场：`framer-motion` staggered fade-in + scale
- Tab 切换：`layoutId` 下划线滑动动画
- 卡片点击：`whileTap={{ scale: 0.96 }}` 反馈
- 页面滚动时卡片 viewport 进入动画（`whileInView`）

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/energy-studio/AudienceHub.tsx` | 重写为瀑布流卡片 |
| `src/pages/EnergyStudio.tsx` | 重写布局、tab、工具卡片样式 |
| `src/components/tools/EmotionSOSPreviewCard.tsx` | 改为突出横幅样式 |

不涉及数据库变更，纯前端改动。

