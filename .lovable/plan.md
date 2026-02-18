

# 取消占位邮箱，全面改用原生手机号认证

## 问题
当前登录和注册仍优先使用占位邮箱 `phone_86xxx@youjin.app`，手机号只是兜底。需要反转优先级：**只用手机号认证**，占位邮箱作为兜底（兼容老用户）。

## 改动

### 1. `src/pages/Auth.tsx`

**登录（约第 318-335 行）**：反转顺序，优先用 `phone` 登录，失败再用占位邮箱兜底：
```typescript
const phoneWithCode = `${countryCode}${phone}`;
const { error } = await supabase.auth.signInWithPassword({
  phone: phoneWithCode,
  password,
});

if (error) {
  // 兜底：老用户可能只有占位邮箱
  const placeholderEmail = generatePhoneEmail(countryCode, phone);
  const { error: emailError } = await supabase.auth.signInWithPassword({
    email: placeholderEmail,
    password,
  });
  if (emailError) {
    throw new Error('手机号或密码错误');
  }
}
```

**注册（约第 368-377 行）**：改用 `phone` 注册：
```typescript
const phoneWithCode = `${countryCode}${phone}`;
const { data, error } = await supabase.auth.signUp({
  phone: phoneWithCode,
  password,
  options: {
    data: { display_name: displayName.trim() },
  },
});
```

`placeholderEmail` 变量移到登录兜底逻辑内部按需生成，不再提前生成。

### 2. `src/components/onboarding/QuickRegisterStep.tsx`

**登录（约第 430-450 行）**：同样反转，优先 phone，兜底占位邮箱：
```typescript
const phoneWithCode = `${countryCode}${phone}`;
let loginData = null;
const { data, error } = await supabase.auth.signInWithPassword({
  phone: phoneWithCode,
  password,
});

if (error) {
  const placeholderEmail = generatePhoneEmail(countryCode, phone);
  const { data: emailData, error: emailError } = await supabase.auth.signInWithPassword({
    email: placeholderEmail,
    password,
  });
  if (emailError) throw new Error('手机号或密码错误');
  loginData = emailData;
} else {
  loginData = data;
}
```

**注册（约第 369-376 行）**：改用 `phone` 注册：
```typescript
const phoneWithCode = `${countryCode}${phone}`;
const { data, error } = await supabase.auth.signUp({
  phone: phoneWithCode,
  password,
  options: {
    data: { display_name: nickname || undefined },
  },
});
```

### 不变的部分
- `generatePhoneEmail` 函数保留（兜底仍需要）
- 邮箱登录模式不变
- profiles 表写入逻辑不变
- 手机号查重逻辑不变
- 批量注册函数不变

