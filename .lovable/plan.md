

# 去除合伙人卡片

## 分析

当前成长支持路径页面的渲染逻辑：
- `growthNodes.slice(0, 3)` 显示前3个节点（测评、AI教练、训练营）
- `growthNodes[3]` 显示365会员节点
- 见证故事卡片（静态渲染）

合伙人节点（`growthNodes[4]`）虽然未直接渲染，但配置文件中仍保留了相关数据，需要清理。

## 修改内容

### 1. 清理配置文件 `src/config/growthPathConfig.ts`

| 修改项 | 操作 |
|--------|------|
| `GrowthStage` 类型 | 移除 `'partner'` |
| `growthNodes` 数组 | 移除第5个合伙人节点 |
| `stageLabels` | 移除 `partner` 键值对 |
| `stageCtas` | 移除 `partner` 键值对 |

### 2. 清理可视化组件 `src/components/growth/GrowthPathVisualization.tsx`

| 修改项 | 操作 |
|--------|------|
| `stageOrder` 数组 | 移除 `'partner'` |

## 预期效果

- 配置中不再包含合伙人相关数据
- 类型定义更加精确（只有4个阶段）
- 页面显示不变（本来就没显示合伙人卡片），但代码更简洁

