
# 修复手机号重复注册问题

## 问题根因

注册时的手机号重复检查失效，原因是 `profiles` 表的 RLS 策略不允许未登录用户（anon）执行 SELECT 查询。

### 数据流分析

```text
注册页面（未登录状态）
  |
  ├── 1. 查询 profiles 表检查手机号是否存在
  |      → RLS 策略要求 authenticated，anon 用户查询返回空
  |      → 重复检查失效，误判为"可以注册"
  |
  ├── 2. 调用 supabase.auth.signUp(email: 占位邮箱)
  |      → Auth 层只检查 email 是否重复
  |      → 第一个账号用 phone 字段创建（无 email），不冲突
  |      → 创建了新账号
  |
  └── 结果：同一手机号产生两个 auth.users 记录
```

### 牛莹的两个账号

| 属性 | 账号1（牛莹） | 账号2（莹莹） |
|------|--------------|--------------|
| 创建方式 | 批量注册（Admin API） | 正常注册页面 |
| auth.users.email | 无 | phone_8616639119807@youjin.app |
| auth.users.phone | +8616639119807 | 无 |
| profiles.phone | 16639119807 | 16639119807 |
| 绽放权益 | 有（已 claimed） | 无 |

## 修复方案

### 方案：添加 anon 用户的受限 SELECT 策略

在 `profiles` 表上新增一条 RLS 策略，允许匿名用户仅通过手机号查询 `id` 字段是否存在。这样注册时的重复检查就能正常工作。

### 技术实现

#### 1. 数据库迁移 -- 添加 RLS 策略

新增一条策略，允许 anon 角色按手机号检查是否存在记录：

```sql
CREATE POLICY "Allow anon to check phone existence"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (
    phone IS NOT NULL
    AND deleted_at IS NULL
  );
```

注意：虽然这会让 anon 用户能 SELECT profiles 行（仅限有手机号且未删除的），但注册代码只查询 `id` 字段（`.select('id')`），不会暴露敏感信息。如果希望进一步限制，可以改用数据库函数（RPC）方式，只返回 true/false。

#### 2. 可选的更安全方案 -- 使用 RPC 函数

创建一个数据库函数，仅返回是否存在，不暴露任何用户数据：

```sql
CREATE OR REPLACE FUNCTION public.check_phone_exists(
  p_phone TEXT,
  p_country_code TEXT DEFAULT '+86'
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE phone = p_phone
      AND phone_country_code = p_country_code
      AND deleted_at IS NULL
  );
$$;
```

然后将 Auth.tsx 和 QuickRegisterStep.tsx 中的重复检查改为调用此函数：

```typescript
// 替换原来的 profiles 表查询
const { data: exists } = await supabase.rpc('check_phone_exists', {
  p_phone: phone,
  p_country_code: countryCode,
});

if (exists) {
  throw new Error('该手机号已注册，请直接登录');
}
```

#### 3. 修改文件

- **src/pages/Auth.tsx**（约第348-364行）：将 profiles SELECT 查询替换为 `supabase.rpc('check_phone_exists', ...)`
- **src/components/onboarding/QuickRegisterStep.tsx**（约第358-369行）：同样替换

### 4. 处理牛莹的重复账号

使用现有的 `cleanup-duplicate-user` 边缘函数删除无权益的第二个账号（莹莹，`cd79f235-...`），保留有绽放权益的第一个账号（牛莹，`7822045a-...`）。

## 推荐方案

采用 **RPC 函数方案**（方案2），因为：
- 使用 `SECURITY DEFINER` 绕过 RLS，直接查询
- 只返回布尔值，不暴露任何用户数据
- 最小权限原则，比开放 anon SELECT 策略更安全
