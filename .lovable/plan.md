

## 统一体验包与产品列表 — 补齐 3 项工具

### 目标

将 `/packages` 页的工具列表从硬编码改为数据库驱动，与体验包共享同一数据源。以后在后台添加新工具时，体验包和产品页自动同步。

### 当前状态

体验包已包含尝鲜会员 + 3 项测评（共 4 项）。`/packages` 页额外硬编码了 3 项日常工具，但这些不在数据库中。

### 步骤

#### 1. 数据库迁移

- 向 `partner_experience_items` 表添加 `category` 列（text，默认 'assessment'）
- 插入 3 条新记录：alive_check、awakening_system、emotion_button（category 设为 'tool'）
- 更新现有 4 条记录的 category 为 'assessment'

#### 2. 更新 useExperiencePackageItems hook

- ExperienceItem 接口添加 `category` 字段
- 查询时包含 category
- fallback 数据扩展到 7 项

#### 3. 更新 youjinPartnerProducts.ts

- experiencePackageItems 数组从 4 项扩展到 7 项
- 每项添加 category 字段

#### 4. 改造 Tools99Grid

- 移除硬编码的 TOOLS_99_PRODUCTS 常量
- 改为调用 useExperiencePackageItems() 获取数据
- 按 category 字段分组（assessment 左列、tool 右列）
- 保留现有双栏布局和卡片样式

### 改动文件

| 文件 | 改动 |
|------|------|
| 数据库 | 添加 category 列 + 3 条记录 |
| `src/hooks/useExperiencePackageItems.ts` | 添加 category 字段 |
| `src/config/youjinPartnerProducts.ts` | fallback 扩展到 7 项 |
| `src/components/Tools99Grid.tsx` | 移除硬编码，改用 hook |

### 不需要改动

- `partner-self-redeem` 边缘函数（已动态读取数据库）
- 其他消费 useExperiencePackageItems 的组件（自动获得新数据）

