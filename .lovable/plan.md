

# 将剩余 3 个套餐恢复为 ¥9.9

## 当前状态（3 个套餐）

| package_key | 套餐名称 | 当前价格 |
|-------------|----------|----------|
| `emotion_health_assessment` | 情绪健康测评 | **¥0.01** |
| `midlife_awakening_assessment` | 中场觉醒力测评 | **¥0.01** |
| `women_competitiveness_assessment` | 35+女性竞争力测评 | **¥0.01** |

## 修改方案

### 数据库迁移
```sql
UPDATE packages 
SET price = 9.9 
WHERE package_key IN (
  'emotion_health_assessment',
  'midlife_awakening_assessment',
  'women_competitiveness_assessment'
);
```

### 不受影响
- 前端代码（动态读取数据库价格）
- 支付流程
- 已购买记录和权限判断
- 实际支付金额按数据库实时值

### 最终价格汇总
| 套餐数量 | 价格 | 说明 |
|----------|------|------|
| 9 个 | ¥9.9 | 全部恢复标准价格 |
| 0 个 | ¥0.01 | 无促销套餐 |

