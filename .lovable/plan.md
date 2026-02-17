

# 清理 Lisa 重复账号

## 操作内容

保留旧账号 `4b450663`（含合伙人身份、订单、邀请码），软删除新账号 `314a9dde`。

### 步骤

1. **软删除新账号 Profile**：设置 `deleted_at`、`is_disabled = true`、清空 `phone` 字段（防止登录冲突）
2. **删除新账号 Auth 用户**：通过 edge function 调用 admin API 删除 `314a9dde` 的 auth.users 记录，彻底阻止登录

### 需要执行的 SQL（通过 edge function）

对 profiles 表：
```text
UPDATE profiles SET
  deleted_at = now(),
  is_disabled = true,
  disabled_at = now(),
  disabled_reason = '重复账号清理，权益已保留在主账号',
  phone = null
WHERE id = '314a9dde-3b7f-46f0-a2bf-5248ee36c046';
```

对 auth.users：通过现有的 `cleanup-duplicate-user` edge function 删除该 auth 用户（需修改函数使其接受动态 user ID 而非硬编码）。

### 实现方式

修改 `supabase/functions/cleanup-duplicate-user/index.ts`，使其接受请求体中的 `userId` 参数，而非硬编码 ID。然后通过该函数删除新账号的 auth 记录。

### 注意事项

- Lisa 之后需要用手机号 `15109251240` + 密码 `123456` 登录旧账号
- 登录后需要修改密码（`must_change_password = true`）

