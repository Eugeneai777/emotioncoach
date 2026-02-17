

## 绽放训练营与产品中心同步

### 问题分析

`/camps` 页面从 `camp_templates` 表读取数据，而产品中心从 `packages` 表读取。当前两表不同步：

| 产品 | packages 表 | camp_templates 表 | 状态 |
|------|------------|-------------------|------|
| 身份绽放训练营 ¥2,980 | 有 | 有 | 已同步 |
| 情感绽放训练营 ¥3,980 | 有 | 有 | 已同步 |
| 生命绽放特训营 ¥12,800 | 有 | **缺失** | 需添加 |

"绽放教练认证"和"绽放合伙人"属于非训练营产品，不需要出现在 `/camps` 页面。

### 修改方案

**1. 数据库：向 `camp_templates` 添加"生命绽放特训营"**

插入一条新记录，字段与现有绽放训练营风格保持一致：

- `camp_type`: `life_bloom`
- `camp_name`: 生命绽放特训营
- `category`: bloom
- `duration_days`: 根据产品设定（如 30 天）
- `price`: 12800
- `icon`: 适当 emoji（如 🌸 或 ✨）
- `gradient`: 与绽放系列统一紫粉色调
- `display_order`: 4（排在情感绽放之后）
- `is_active`: true

**2. 代码：无需改动**

`/camps` 页面已按 `category` 筛选 `camp_templates`，新增记录后会自动显示。

### 涉及变更

- 数据库 `camp_templates` 表：INSERT 1 条新记录
- 无代码文件修改
