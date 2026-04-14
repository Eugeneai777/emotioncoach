

# Mini App 4个测评价格调整为 ¥0.01

## 变更内容

| 测评 | package_key | 当前价格 | 调整后 |
|------|-------------|---------|--------|
| 情绪健康测评 | `emotion_health_assessment` | ¥9.90 | **¥0.01** |
| 中场觉醒力测评 | `midlife_awakening_assessment` | ¥9.90 | **¥0.01** |
| 35+女性竞争力测评 | `women_competitiveness_assessment` | ¥9.90 | **¥0.01** |
| 财富卡点测评 | `wealth_block_assessment` | ¥9.90 | **¥0.01** |

## 实施方式

通过数据库 UPDATE 语句修改 `packages` 表中这 4 条记录的 `price` 字段为 `0.01`。

```sql
UPDATE packages SET price = 0.01 
WHERE package_key IN (
  'emotion_health_assessment',
  'midlife_awakening_assessment',
  'women_competitiveness_assessment',
  'wealth_block_assessment'
);
```

前端价格为动态读取，无需修改代码。

