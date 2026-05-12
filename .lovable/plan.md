## 目标
优化【有劲生活馆】-【专业测评】的标签和排序。

## 改动

### 1. `src/config/energyStudioTools.ts`（标签调整）
- `male-midlife-vitality`：`tags` 改为 `["热门"]`（去掉"男士专属"，"新"→"热门"）
- `emotion-health`：`tags` 改为 `["热门"]`
- `women-competitiveness`：`tags` 改为 `["推荐"]`（原为 `["热门"]`）

### 2. 数据库迁移（专业测评显示顺序）
通过 `energy_studio_tools.display_order` 让顺序变成：
财富卡点 → 情绪健康 → 35+女性竞争力 → SCL-90 → 男人有劲 → 中场觉醒

UPDATE：
- `wealth-block` → 0
- `emotion-health` → 1
- `women-competitiveness` → 2
- `scl90` → 3
- `male-midlife-vitality` → 4
- `midlife-awakening` → 5

## 不改动
- 不改测评本身的内容、路由、图标
- 不动【日常工具】tab
