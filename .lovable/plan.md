

## 优化方案：微信用户绑定手机号后自动同步 Auth 邮箱

### 问题现状

微信注册用户的 `auth.users.email` 为 `wechat_xxx@temp.youjin365.com`。当用户在个人资料中绑定手机号后，`profiles.phone` 已更新，但 `auth.users.email` 仍是微信临时邮箱，导致该用户无法通过手机号+密码登录。

### 解决方案

在 `PhoneNumberManager.tsx` 的 `handleSave` 中，手机号保存成功后，调用 `cleanup-duplicate-user` Edge Function 的 `update-auth-user` 操作，将 `auth.users.email` 更新为 `phone_{区号}{手机号}@youjin.app` 格式。

### 具体改动

**文件：`src/components/profile/PhoneNumberManager.tsx`**

在手机号保存成功后（约第 94 行 `if (error) throw error` 之后），增加逻辑：

1. 检查当前用户 email 是否为 `@temp.youjin365.com` 格式（即微信注册用户）
2. 如果是，拼接新邮箱 `phone_{区号去+}{手机号}@youjin.app`
3. 调用 `cleanup-duplicate-user` Edge Function，传入 `action: 'update-auth-user'`，更新 auth email 并设置 `email_confirm: true`
4. 仅更新邮箱标识，不改密码（微信用户可能从未设置过密码）

### 安全考虑

- 先查询 `profiles` 表确认该手机号未被其他账号占用，避免邮箱冲突
- 仅对 `@temp.youjin365.com` 用户执行，已有 `phone_` 邮箱的用户跳过
- Edge Function 已有 service role 权限，能安全更新 auth 记录

### 不需要改动的部分

- Edge Function `cleanup-duplicate-user` 已支持 `update-auth-user` 操作，无需修改
- 数据库无需新增表或字段

