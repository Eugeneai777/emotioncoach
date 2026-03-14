

## 修复 18898593978 登录问题

### 问题
用户 **炯谦**（ID: `5e5cdc49-f922-499a-916e-b5d2cda0d051`）的 auth 邮箱为微信临时邮箱，导致手机号登录无法匹配。

### 操作步骤

1. **调用 `cleanup-duplicate-user` Edge Function**，执行 `update-auth-user` 操作：
   - 将 auth email 更新为 `phone_8618898593978@youjin.app`
   - 设置初始密码 `123456`
   - 确认邮箱（`email_confirm: true`）

2. **更新 profiles 表**：设置 `must_change_password = true`，触发用户首次登录后强制改密码

### 无需代码改动
所有操作通过现有 Edge Function 和数据库更新完成。

