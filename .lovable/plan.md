在 mini-app 首页「探索更多」区块中，去掉「健康商城」卡片，并将剩余的 4 张卡片改为水平滑动的一排。

### 变更内容

1. **删除健康商城卡片**
   - 从 `exploreBlocks` 数组中移除「健康商城」对象（含 `ShoppingBag` 图标及相关样式）。

2. **布局改为水平滑动**
   - 外层容器从 `grid grid-cols-2 gap-3` 改为 `flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory`（复用现有横向滚动的样式模式）。
   - 每个卡片增加 `shrink-0 snap-start` 和固定最小宽度 `min-w-[180px]`，确保在移动端可以横向滑动浏览，一屏可见约 2 张卡片。

3. **保持现有卡片样式**
   - 卡片内部的图标、标题、副标题、描述、「去查看」按钮、渐变背景、动画等全部保持不变。
   - 保留 `motion.button` 的 `initial/animate/transition/whileTap` 动画效果。

### 涉及文件
- `src/pages/MiniAppEntry.tsx`