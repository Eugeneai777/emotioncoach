

# 首次登录修改密码 + 全用户改密码功能

## 现状分析

系统已有完整的密码修改功能，位于 `src/components/profile/AccountCredentials.tsx`，用户可在个人资料页面修改密码。

需要解决的是：**批量注册的用户（默认密码 123456）首次登录后强制修改密码**。

## 方案

### 1. 数据库：profiles 表新增字段

在 `profiles` 表新增 `must_change_password` 布尔字段（默认 false）：

```sql
ALTER TABLE public.profiles 
ADD COLUMN must_change_password boolean DEFAULT false;

-- 标记已有的批量注册用户
UPDATE public.profiles 
SET must_change_password = true 
WHERE id IN (
  SELECT claimed_by FROM public.partner_invitations 
  WHERE claimed_source = 'batch' AND claimed_by IS NOT NULL
);
```

### 2. Edge Function：批量注册时标记

修改 `batch-register-bloom-partners/index.ts`，新注册用户创建 profile 时设置 `must_change_password: true`。

### 3. 前端：登录后拦截

修改 `src/pages/Auth.tsx` 登录成功后的跳转逻辑：

- 登录成功时查询 `profiles.must_change_password`
- 如果为 true，跳转到 `/change-password` 而非原目标页面

### 4. 新建强制修改密码页面

创建 `src/pages/ChangePassword.tsx`：

- 复用现有密码修改逻辑（`supabase.auth.updateUser({ password })`）
- 修改成功后更新 `profiles.must_change_password = false`
- 然后跳转到原目标页面
- 页面不可跳过（无返回/关闭按钮）

### 5. 路由守卫

在 `App.tsx` 添加路由，确保 `must_change_password = true` 的用户无法访问其他页面。

## 修改文件清单

| 文件 | 修改内容 |
|------|----------|
| 数据库迁移 | profiles 新增 must_change_password 字段 |
| `supabase/functions/batch-register-bloom-partners/index.ts` | 新注册用户标记 must_change_password |
| `src/pages/Auth.tsx` | 登录后检查并跳转 |
| `src/pages/ChangePassword.tsx` | 新建强制修改密码页面 |
| `src/App.tsx` | 添加 /change-password 路由 |

## 用户体验流程

1. 管理员批量注册用户（密码 123456）
2. 用户用手机号 + 123456 登录
3. 系统检测到 `must_change_password = true`
4. 自动跳转到修改密码页面（不可跳过）
5. 用户设置新密码后正常使用
6. 已有账号的用户不受影响（字段默认 false）

现有的"账号与密码"设置（AccountCredentials）继续作为所有用户日常修改密码的入口，无需改动。

