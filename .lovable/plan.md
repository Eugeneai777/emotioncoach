

# 恢复 4 个测评价格为 ¥9.9

通过数据库 UPDATE 将以下 4 个测评套餐价格从 ¥0.01 恢复为 ¥9.9：

| 测评 | package_key |
|------|-------------|
| 情绪健康测评 | `emotion_health_assessment` |
| 中场觉醒力测评 | `midlife_awakening_assessment` |
| 35+女性竞争力测评 | `women_competitiveness_assessment` |
| 财富卡点测评 | `wealth_block_assessment` |

## 实施

```sql
UPDATE packages SET price = 9.9 
WHERE package_key IN (
  'emotion_health_assessment',
  'midlife_awakening_assessment',
  'women_competitiveness_assessment',
  'wealth_block_assessment'
);
```

前端动态读取价格，无需修改代码。

