

## 优化有劲小工具卡片布局

### 当前问题

截图显示每个产品卡片被拉伸到整列的高度，导致"尝鲜会员"和"死了吗打卡"下方出现大量空白。原因是 `ProductCard` 使用了 `h-full` 和 `flex-1`，使卡片撑满网格单元格高度。

### 修改方案

**文件：** `src/components/Tools99Grid.tsx`

1. 移除 `MobileCard` 上的 `h-full` 类，让卡片根据内容自适应高度
2. 移除 features 列表上的 `flex-1`，避免内容区域被拉伸
3. 每个卡片紧凑排列，自然堆叠在各自列中

### 技术细节

在 `ProductCard` 组件中：
- `MobileCard` 的 className 从 `relative flex flex-col h-full` 改为 `relative flex flex-col`（去掉 `h-full`）
- `<ul>` 的 className 从 `mt-2 space-y-1 flex-1` 改为 `mt-2 space-y-1`（去掉 `flex-1`）

这样每张卡片高度由内容决定，左列 4 张卡片、右列 3 张卡片紧凑堆叠，不再出现大面积空白。

### 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/Tools99Grid.tsx` | 修改 | 移除 h-full 和 flex-1，卡片自适应高度 |

