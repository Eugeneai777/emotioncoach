

# 清除 18588235488 的7天有劲训练营权益

## 用户信息
- 用户：小王子（07f04ecd-7b1d-441c-8734-a61865f27af0）
- 电话：18588235488

## 需清除的记录

| 表 | 记录 | 操作 |
|---|---|---|
| `user_camp_purchases` | id: 9e2d8438，emotion_stress_7，completed | DELETE |
| `orders` | id: 551461a5，synergy_bundle，¥0.01，paid | UPDATE status → 'refunded' |
| `training_camps` | 无记录 | 无需操作 |

## 关键说明
必须将 orders 状态改为 `refunded`，否则 `check-order-status` 自愈机制会自动恢复 `user_camp_purchases` 记录。

## 执行步骤
1. DELETE `user_camp_purchases` 中的购买记录
2. UPDATE `orders` 表中对应订单 status 为 `refunded`

