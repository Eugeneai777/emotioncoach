

# 更新7天有劲训练营定价

## 改动

通过数据库迁移更新 `camp_templates` 表中 `emotion_stress_7` 的价格：

- `original_price`: 599 → **299**（划线价）
- `price`: 0.01 → **199**（实际售价）

## 无需改代码

现有 UI 组件（`CampTemplateCard`、`StartCampDialog`、`CampPurchaseDialog`）已支持：
- 当 `original_price > price` 时自动显示划线价（¥299 ~~删除线~~）
- 下方显示实际价格 ¥199

只需一条 SQL 迁移即可完成。

