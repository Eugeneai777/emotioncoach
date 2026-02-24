

## 给全部绽放合伙人补发 100 点

### 操作内容

通过数据库批量更新，为所有绽放合伙人的 `user_accounts` 增加 100 点 `total_quota`。

### 执行步骤

1. **为已有 user_accounts 记录的绽放合伙人增加 100 点**

```sql
UPDATE user_accounts 
SET total_quota = total_quota + 100, updated_at = NOW()
WHERE user_id IN (
  SELECT user_id FROM partners WHERE partner_type = 'bloom'
);
```

2. **为没有 user_accounts 记录的绽放合伙人创建记录并给 100 点**（当前有 1 位）

```sql
INSERT INTO user_accounts (user_id, total_quota, used_quota)
SELECT p.user_id, 100, 0
FROM partners p
LEFT JOIN user_accounts ua ON ua.user_id = p.user_id
WHERE p.partner_type = 'bloom' AND ua.user_id IS NULL;
```

### 影响范围

- 所有绽放合伙人（不区分 status），每人 +100 点
- 已有点数的合伙人会在原有基础上累加 100
- 不修改任何代码，前端课程页面余额会自动显示更新后的数值

