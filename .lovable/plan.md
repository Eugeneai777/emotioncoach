

# 彻底撤销 18588235488 的【7天有劲训练营】权限

## 当前数据库状态

| 表 | 记录 | 说明 |
|---|---|---|
| `orders` | synergy_bundle, status=paid | 这是权益来源，自愈机制依赖它 |
| `training_camps` | emotion_stress_7, active | 上次删除可能未生效 |
| `training_camps` | emotion_journal_21, active | 同一笔订单授予 |
| `user_camp_purchases` | emotion_journal_21, completed | 自愈补写的 |

## 问题

synergy_bundle 是一笔订单同时授予 `emotion_stress_7` + `emotion_journal_21`。要彻底阻止自愈恢复，必须将该订单状态改为 `refunded`，**这会同时撤销21天情绪日记的权限**。

## 执行计划（3步数据操作）

1. **`orders`**：将 synergy_bundle 订单状态改为 `refunded`（阻断自愈机制）
2. **`training_camps`**：删除 `emotion_stress_7` 的 active 记录
3. **`user_camp_purchases`**：删除 `emotion_journal_21` 的 completed 记录（如有）

执行后该账号将：
- 无法进入7天有劲训练营
- 同时失去21天情绪日记权限
- 自愈机制不会恢复（订单已非 paid 状态）
- 可以重新走完整购买流程测试

如果你希望**保留21天情绪日记权限**，需要单独为 emotion_journal_21 创建一笔独立的 paid 订单记录。请确认是否需要。

## 不变项
- 不修改代码，纯数据操作

