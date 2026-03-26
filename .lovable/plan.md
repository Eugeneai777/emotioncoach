

# 清除账号 18588235488 的 synergy_bundle 购买记录 + 验证购买后流程

## 当前数据状态

| 表 | 记录 |
|---|------|
| `orders` | 1条：`synergy_bundle`, status=`paid`, amount=0.01 |
| `user_camp_purchases` | 无相关记录 |
| `training_camps` | 有 `emotion_journal_21`(active)，无 `emotion_stress_7` |

## 执行步骤

### 步骤1：清除购买记录
通过数据库迁移删除该用户的 synergy_bundle 订单：

```sql
DELETE FROM orders 
WHERE user_id = '07f04ecd-7b1d-441c-8734-a61865f27af0' 
AND package_key = 'synergy_bundle';
```

清除后，`/promo/synergy` 将恢复为未购买状态，用户可重新走完整购买流程。

### 步骤2：验证购买后跳转流程是否正确

当前购买成功后的路径：
1. `/promo/synergy` 支付成功 → 跳转 `/camp-intro/emotion_stress_7`
2. CampIntro 页面通过 `orderPurchase` 查询 `orders` 表中 `synergy_bundle` → 检测到 `hasPurchased = true`
3. 按钮显示「已购买，立即开始」→ 弹出 `StartCampDialog` → 创建训练营 → 进入打卡页

**此流程逻辑已经正确**，不需要代码修改。购买 synergy_bundle 后：
- `useCampPurchase` 会匹配 `['emotion_stress_7', 'synergy_bundle']`
- CampIntro 的 `orderPurchase` 查询也会匹配 `['synergy_bundle', 'camp-emotion_stress_7']`
- 两者任一命中即 `hasPurchased = true`，不会再显示付费按钮

## 影响范围
- 仅删除1条订单记录，不影响该用户的其他训练营（emotion_journal_21、wealth_block_7 等）
- 不涉及代码修改

