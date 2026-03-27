

# 清除账号 18898593978 的【7天情绪解压训练营】权益

## 需要删除的数据

| 表 | ID | 说明 |
|---|---|---|
| `training_camps` | `83ed0875-403e-44db-a1f4-3e72ea39d83d` | emotion_stress_7, active |
| `user_camp_purchases` | `67e09d52-18cc-446f-b337-5dee637b6f54` | emotion_stress_7, completed |

## 执行 SQL

```sql
DELETE FROM training_camps WHERE id = '83ed0875-403e-44db-a1f4-3e72ea39d83d';
DELETE FROM user_camp_purchases WHERE id = '67e09d52-18cc-446f-b337-5dee637b6f54';
```

## 保留不动

- `emotion_journal_21` 购买记录（`3fb04e09`）保留
- 订单表 orders 不变（保持 paid 状态作为支付凭证）

清除后该用户访问【7天情绪解压训练营】将显示为未购买状态，可重新测试购买流程。

