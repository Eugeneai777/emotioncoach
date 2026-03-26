

# 移除账号 18588235488 的「7天情绪解压训练营」权益

## 数据现状

| 表 | ID | 内容 |
|---|---|------|
| `training_camps` | `73e9e07d-...` | camp_type=`emotion_stress_7`, status=`active` |
| `user_camp_purchases` | `2ebeaf8d-...` | camp_type=`emotion_stress_7`, payment_status=`completed` |
| `orders` | `e1abbf71-...` | package_key=`synergy_bundle`, status=`paid`, amount=0.01 |

## 执行步骤

### 步骤 1：删除训练营记录
```sql
DELETE FROM training_camps WHERE id = '73e9e07d-aeb2-48a0-bd1b-eb82be268526';
```

### 步骤 2：删除购买权益记录
```sql
DELETE FROM user_camp_purchases WHERE id = '2ebeaf8d-5b7b-47ac-a13a-28b0b37bc008';
```

### 步骤 3：将订单标记为已退款
```sql
UPDATE orders SET status = 'refunded' WHERE id = 'e1abbf71-db65-4c78-8b76-100c7e325327';
```

## 说明
- 实际微信退款 0.01 元无法通过系统操作，需在微信商户平台手动处理（金额极小，可忽略）
- 该用户的 `emotion_journal_21`（21天情绪日记训练营）**不受影响**
- 操作后用户再访问 `/promo/synergy` 将显示未购买状态，可重新走购买流程

