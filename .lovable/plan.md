

# /energy-studio 主页精简 + 小红书专属页

## 思路

将 `/energy-studio` 主页精简为只展示 6 个人群入口按钮（宝妈、职场、情侣、青少年、中年、银发），其余所有内容（快捷入口、工具、测评）移到一个新的小红书风格专属页。

## 改动

### 1. 精简 `src/pages/EnergyStudio.tsx`

- 移除快捷入口、Tab 切换、工具列表、测评列表等
- 仅保留 PageHeader + AudienceHub（6 个人群按钮）
- AudienceHub 改为更大、更突出的卡片样式（占满屏幕），增加一个"探索更多工具"入口跳转到新页面

### 2. 改造 `src/components/energy-studio/AudienceHub.tsx`

- 卡片放大：从 3x2 小卡片改为 2x3 大卡片，每个卡片更高（~120px）
- 更大的 emoji 和文字，渐变封面更突出
- 整体居中，视觉更聚焦

### 3. 新建 `src/pages/EnergyStudioExplore.tsx`（小红书风格专属页）

- 路由：`/energy-studio/explore`
- 包含原来的：快捷入口、情绪 SOS、日常工具、专业测评（Tab 切换）
- 采用小红书双列瀑布流卡片布局展示工具
- 卡片样式：顶部渐变色块 + 底部白底文字 + 圆角阴影

### 4. 路由注册

- 在 App.tsx 中添加 `/energy-studio/explore` 路由

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/pages/EnergyStudio.tsx` | 精简为仅 6 按钮 + 探索入口 |
| `src/components/energy-studio/AudienceHub.tsx` | 放大卡片样式 |
| `src/pages/EnergyStudioExplore.tsx` | 新建，小红书风格工具页 |
| `src/App.tsx` | 注册新路由 |

无数据库改动。

