

# 清除账号 18898593978 的7天有劲训练营权益（用于重新测试兑换码）

## 用户信息

- 用户：炯谦，user_id = `5e5cdc49-f922-499a-916e-b5d2cda0d051`

## 执行操作（3步，防自愈机制恢复）

| 步骤 | 表 | SQL 操作 |
|---|---|---|
| 1 | `orders` | UPDATE status → `refunded`，条件：user_id + package_key = `synergy_bundle` + status = `paid` |
| 2 | `user_camp_purchases` | DELETE，条件：user_id + camp_type IN (`emotion_stress_7`, `emotion_journal_21`) |
| 3 | `training_camps` | UPDATE status → `cancelled`，条件：user_id + camp_type IN (`emotion_stress_7`, `emotion_journal_21`) + status IN (`active`, `completed`) |

### 为什么必须三表同步

系统自愈机制会检查 `orders` 表中 `paid` 状态的订单并自动补齐 `user_camp_purchases`。若仅删除购买记录而不改订单状态，用户再次访问时权益会被自动恢复。

### 兑换码状态

如果该用户之前通过兑换码开通，还需将 `synergy_activation_codes` 中对应记录的 `is_used` 重置为 `false`，以便该码可再次用于测试。

执行完成后，用户在 `/promo/synergy` 页面将回到未购买状态，可重新输入兑换码测试完整流程。

