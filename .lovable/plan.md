## 目标

让 mini-app 首页的"探索更多"模块在视觉与布局上和页面其他区块（特别是"使用场景"语音教练卡片区）统一，去掉横向滚动 + 大卡片描述的不一致感。

## 现状对比

页面其他区块统一为：
- 区块标题：彩色竖条 + `text-sm font-bold` 文字
- 卡片：紧凑的 `rounded-xl p-3`、彩色 `iconBg` 圆形图标、标题 + 副标题两行，使用 `bg/ring/glow` 半透明渐变
- 布局：2 列或 2/4 列网格（不滚动）

"探索更多"目前是：
- 横向滚动 `flex overflow-x-auto snap-x` + `min-w-[180px]`
- 大卡片：含图标、标题、副标题、描述、"去查看 ›" 按钮
- 内边距、字号、结构都比其他区块更重

## 改动

只改 `src/pages/MiniAppEntry.tsx` 探索模块的 JSX（约 596–636 行），不改数据、路由、动画时序。

1. **容器布局**：从 `flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory` 改为 `grid grid-cols-2 sm:grid-cols-4 gap-2`，与"使用场景"完全一致（4 张卡片正好一行）。
2. **卡片样式**：
   - 去掉 `shrink-0 snap-start min-w-[180px]`
   - 内边距 `p-3.5` → `p-3`
   - 图标块 `w-9 h-9` 保留，但与标题改为上下结构（不再左右并排），对齐"使用场景"卡片
   - 删除描述段 `<p>{block.desc}</p>` 和底部 "去查看 ›" 行
   - 标题 `text-[12px] font-bold`，副标题 `text-[10px] text-muted-foreground`
3. **标题栏**：彩色竖条颜色从 `from-primary to-accent` 改为 `from-cyan-400 to-violet-500`（与卡片色系呼应），其余样式不变。
4. **不再使用的字段**：`desc`、`illustrationKey` 在 JSX 中不再引用（数据保留，避免影响其他逻辑）。
5. **保留**：`motion.button` 动画、`preloadRouteOnIntent`、`navigate`、`reduceMotion`、所有 4 张卡片（日常工具 / 专业测评 / 系统训练营 / 故事教练）及其配色 token。

## 验证

- `tsc --noEmit`
- Playwright 截图 375×812 mini-app 首页，确认探索模块与"使用场景"在卡片大小/字号/间距上一致
