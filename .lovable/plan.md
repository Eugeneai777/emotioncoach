

## 合并小为的两个账号

### 账号情况

| | 旧账号（微信登录） | 新账号（手机号登录） |
|---|---|---|
| UUID | `3260b08a-102e-455a-bc73-0f77f5cc99db` | `a77c8c50-4c21-4f47-be9d-2b6e29a61f8f` |
| 昵称 | 小为 | 马 |
| 手机号 | 无 | 15228901521 |
| 登录方式 | 微信 | 手机号 |

### 旧账号拥有的权益（需迁移）

- 财富卡点测评订单（已支付，¥0 + ¥9.90）
- 财富觉醒训练营购买记录（2条，已完成）
- 365会员订单（已支付）
- 试用包、觉醒系统、情绪按钮订单（已支付）
- 绽放合伙人身份（active）
- 邀请码 BLOOM-XW07 领取记录

### 操作步骤

通过数据库迁移执行以下 SQL：

1. **迁移已支付订单** — 将旧账号所有 `paid` 状态的订单 `user_id` 改为新账号
2. **迁移训练营购买记录** — 将 `user_camp_purchases` 的 `user_id` 改为新账号
3. **迁移合伙人身份** — 将 `partners` 表的 `user_id` 改为新账号
4. **更新邀请码领取记录** — 将 `partner_invitations` 的 `claimed_by` 改为新账号
5. **删除新账号的待支付订单** — 清理那个 ¥9.90 的 pending 订单（因为已有免费的已支付记录）
6. **软删除旧账号** — 设置 `is_disabled = true`、`deleted_at = now()`
7. **删除旧 Auth 用户** — 通过 `cleanup-duplicate-user` 边缘函数删除旧的微信 auth 用户

### 技术细节

```sql
-- 1. 迁移已支付订单
UPDATE orders SET user_id = 'a77c8c50-4c21-4f47-be9d-2b6e29a61f8f'
WHERE user_id = '3260b08a-102e-455a-bc73-0f77f5cc99db' AND status = 'paid';

-- 2. 迁移训练营记录
UPDATE user_camp_purchases SET user_id = 'a77c8c50-4c21-4f47-be9d-2b6e29a61f8f'
WHERE user_id = '3260b08a-102e-455a-bc73-0f77f5cc99db';

-- 3. 迁移合伙人身份
UPDATE partners SET user_id = 'a77c8c50-4c21-4f47-be9d-2b6e29a61f8f'
WHERE user_id = '3260b08a-102e-455a-bc73-0f77f5cc99db';

-- 4. 更新邀请码记录
UPDATE partner_invitations SET claimed_by = 'a77c8c50-4c21-4f47-be9d-2b6e29a61f8f'
WHERE claimed_by = '3260b08a-102e-455a-bc73-0f77f5cc99db';

-- 5. 删除新账号多余的 pending 订单
DELETE FROM orders WHERE id = '6ceaf8b9-a305-4c6e-b24f-55c464f415c7';

-- 6. 软删除旧账号 profile
UPDATE profiles SET is_disabled = true, deleted_at = now()
WHERE id = '3260b08a-102e-455a-bc73-0f77f5cc99db';
```

最后通过 `cleanup-duplicate-user` 边缘函数删除旧的 auth 用户。

合并完成后，小为用手机号 15228901521 登录即可看到所有权益（测评、训练营、合伙人身份）。

