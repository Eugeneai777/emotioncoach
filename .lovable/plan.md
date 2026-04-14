

# 7天有劲训练营价格调整

## 变更内容
| 项目 | 当前 | 调整后 |
|------|------|--------|
| 售价 | ¥199 | **¥399** |
| 划线价 | ¥299 | **¥599** |

## 数据库更新
```sql
UPDATE camp_templates 
SET price = 399, original_price = 599 
WHERE camp_type = 'emotion_stress_7';
```

无需修改前端代码，UI 自动适配。

