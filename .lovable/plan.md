

# 彻底清除 18898593978 的【7天有劲训练营】权益并可重测

## 当前数据状况

| 表 | 数据 | 说明 |
|---|---|---|
| `training_camps` | 1 条 `emotion_stress_7` (ID: `75796d74`), status=active | 小程序"学习"能进入的原因 |
| `user_camp_purchases` | 仅 `emotion_journal_21` 1 条 | 无 `emotion_stress_7` 购买记录（上次已删） |
| `orders` | 2 笔 `synergy_bundle` status=paid | 系统自愈逻辑会根据 paid 订单自动补写 purchase 记录 |

## 问题根因

上次清理只删除了 `user_camp_purchases` 中的 `emotion_stress_7` 记录和 `training_camps` 记录，但 **没有处理 orders 表**。由于 `check-order-status` 和 `wechat-pay-callback` 的自愈逻辑会检查 orders 表中 `synergy_bundle` 状态为 `paid` 的订单，自动为用户补写 `user_camp_purchases` 记录。同时 `/promo/synergy` 页面的 `autoCreateAndEnterCamp` 会自动创建 `training_camps` 记录。所以权益被"复活"了。

## 执行方案

### SQL 清理（数据库迁移）

```sql
-- 1. 删除活跃训练营
DELETE FROM training_camps 
WHERE id = '75796d74-009a-4fa0-92d8-f6fff88289d7';

-- 2. 删除 emotion_stress_7 购买记录（如果自愈逻辑已补写）
DELETE FROM user_camp_purchases 
WHERE user_id = '5e5cdc49-f922-499a-916e-b5d2cda0d051' 
  AND camp_type = 'emotion_stress_7';

-- 3. 将两笔 synergy_bundle paid 订单改为 refunded，阻止自愈逻辑再次触发
UPDATE orders SET status = 'refunded', updated_at = NOW()
WHERE user_id = '5e5cdc49-f922-499a-916e-b5d2cda0d051' 
  AND package_key = 'synergy_bundle' 
  AND status = 'paid';
```

### 关联清理

同时清理该训练营关联的进度数据（如有）：
- `camp_daily_progress`
- `camp_daily_tasks`
- `camp_video_tasks`
- `community_posts` 中 `camp_id` 置 NULL

（查询显示这些表当前无关联数据，但为安全仍执行 DELETE/UPDATE）

## 保留不动

- `emotion_journal_21` 购买记录保留
- 其他用户数据不受影响

## 结果

清理后用户访问 `/promo/synergy` 和小程序"学习"页面均显示未购买状态，orders 表中无 paid 的 synergy_bundle 订单，自愈逻辑不会再自动补权。可完整重新测试购买流程。

