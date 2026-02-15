

## 让历史记录卡片始终展开

### 当前行为
每张历史记录卡片默认是折叠的，点击后才展开显示三层得分和操作按钮。

### 修改方案

**修改文件：`src/components/wealth-block/WealthBlockHistory.tsx`**

1. 移除折叠/展开的状态管理（`expandedId`），让所有卡片始终显示详情内容
2. 移除卡片头部的点击展开逻辑和展开/收起箭头按钮
3. 移除 `AnimatePresence` 动画包裹，直接渲染详情区域
4. 保留卡片头部的基本信息展示样式不变

### 技术细节

- 删除 `expandedId` 状态和相关的 `isExpanded` 判断
- 移除头部区域的 `cursor-pointer`、`onClick`、`hover:bg-muted/50` 交互样式
- 移除右侧的 `ChevronDown`/`ChevronUp` 切换按钮
- 详情区域（三层得分 + 操作按钮）直接渲染，不再用条件判断包裹

