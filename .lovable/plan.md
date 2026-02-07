

## 产品中心分"有劲"和"绽放"两大类

### 当前问题

7 个 Tab 平铺在一行，移动端溢出且无法一眼区分品牌归属。用户需要横滑才能看到"绽放"类产品。

### 优化方案

采用**两级导航**结构：

- **第一级**：有劲 / 绽放（两个品牌 Tab）
- **第二级**：品牌下的子分类 Tab

```text
┌──────────────────────────────────┐
│   🔥 有劲系列    |   🦋 绽放系列   │  ← 一级 Tab
├──────────────────────────────────┤
│  💎会员  🧰工具  🔥训练营  💪合伙人 │  ← 二级 Tab（有劲下）
├──────────────────────────────────┤
│          [ 产品内容 ]             │
└──────────────────────────────────┘
```

选中"绽放系列"时，二级 Tab 变为：

```text
│  🦋训练营  👑合伙人  🌟教练       │
```

### 具体修改

#### 1. 更新分类配置，增加品牌分组信息

**文件：** `src/config/productCategories.ts`

- 为 `ProductCategory` 接口新增 `brand: 'youjin' | 'bloom'` 字段
- 有劲系列（youjin-member, tools-99, youjin-camp, youjin-partner）标记 `brand: 'youjin'`
- 绽放系列（bloom-camp, bloom-partner, bloom-coach）标记 `brand: 'bloom'`
- 新增 `shortName` 字段用于二级 Tab 的精简显示（如"会员"、"工具"、"训练营"）
- 导出品牌分组常量：

```text
brandGroups = [
  { id: 'youjin', name: '有劲系列', emoji: '🔥' },
  { id: 'bloom',  name: '绽放系列', emoji: '🦋' }
]
```

#### 2. 重构 Packages 页面导航

**文件：** `src/pages/Packages.tsx`

- 新增 `activeBrand` 状态（默认 'youjin'）
- 一级导航：两个品牌 Tab，使用较大字号和品牌色区分
- 二级导航：根据 `activeBrand` 过滤出当前品牌的子分类，显示 `shortName`
- 切换品牌时，自动选中该品牌下第一个子分类
- 移除 `HorizontalScrollHint`（每级 Tab 数量少，不再需要横滑）

### 视觉效果

- 一级 Tab 使用品牌渐变色调区分：有劲用橙色系，绽放用紫粉色系
- 二级 Tab 保持当前紧凑风格
- 整体导航高度略有增加但每行 Tab 数量大幅减少（最多 4 个），移动端不再溢出

### 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/config/productCategories.ts` | 修改 | 新增 brand、shortName 字段 + 品牌分组常量 |
| `src/pages/Packages.tsx` | 修改 | 两级 Tab 导航结构 |

无需数据库变更，仅前端 UI 调整。

