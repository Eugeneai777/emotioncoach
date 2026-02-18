
# 手机号登录双重匹配：占位邮箱 + 原生手机号

## 问题
批量注册的用户在 `auth.users` 中只有 `phone` 字段、没有占位邮箱，当前登录逻辑仅用占位邮箱匹配，导致这些用户无法登录。

## 方案
登录时先用占位邮箱尝试，失败后自动用 Supabase 原生 `phone + password` 方式兜底登录。两种方式任一成功即可。无需新建 edge function，无需数据迁移。

## 改动文件

### 1. `src/pages/Auth.tsx`（第 318-330 行）

将：
```typescript
const { error } = await supabase.auth.signInWithPassword({
  email: placeholderEmail,
  password,
});
if (error) {
  if (error.message.includes('Invalid login credentials')) {
    throw new Error('手机号或密码错误');
  }
  throw error;
}
```

改为：
```typescript
// 先尝试占位邮箱登录
const { error } = await supabase.auth.signInWithPassword({
  email: placeholderEmail,
  password,
});

if (error) {
  // 兜底：尝试原生手机号登录（批量注册用户可能只有 phone 没有占位邮箱）
  const phoneWithCode = `${countryCode}${phone}`;
  const { error: phoneError } = await supabase.auth.signInWithPassword({
    phone: phoneWithCode,
    password,
  });
  if (phoneError) {
    throw new Error('手机号或密码错误');
  }
}
```

### 2. `src/components/onboarding/QuickRegisterStep.tsx`（第 430-440 行）

将：
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: placeholderEmail,
  password,
});
if (error) {
  if (error.message?.includes('Invalid login credentials')) {
    throw new Error('手机号或密码错误');
  }
  throw error;
}
if (!data.user) throw new Error('登录失败');
```

改为：
```typescript
// 先尝试占位邮箱登录
let loginData = null;
const { data, error } = await supabase.auth.signInWithPassword({
  email: placeholderEmail,
  password,
});

if (error) {
  // 兜底：原生手机号登录
  const phoneWithCode = `${countryCode}${phone}`;
  const { data: phoneData, error: phoneError } = await supabase.auth.signInWithPassword({
    phone: phoneWithCode,
    password,
  });
  if (phoneError) {
    throw new Error('手机号或密码错误');
  }
  loginData = phoneData;
} else {
  loginData = data;
}
if (!loginData?.user) throw new Error('登录失败');
```

后续代码中将 `data.user` 替换为 `loginData.user`。

## 不需要改动的部分
- 注册逻辑保持使用占位邮箱不变
- 邮箱登录模式不变
- 批量注册函数不变
- 无需新建 edge function 或迁移数据
