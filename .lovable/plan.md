

# /auth 短信验证码功能问题诊断

经过对前端 `Auth.tsx`、后端 `send-sms-code/index.ts` 和 `verify-sms-login/index.ts` 的完整审查，发现以下问题：

---

## 问题一：`verify-sms-login` 用 `listUsers()` 查全量用户（P0 严重）

**第53行**：`adminClient.auth.admin.listUsers()` 默认只返回前 50 个用户。当用户数超过 50 后，新注册的用户可能查不到，导致：
- 已注册用户被误判为新用户，重复创建账号失败
- 或创建出重复占位邮箱账号

**修复**：改用 `adminClient.auth.admin.listUsers({ filter: placeholderEmail })` 或直接用 `adminClient.auth.admin.getUserByEmail(placeholderEmail)` 精准查询。

---

## 问题二：临时密码 fallback 会覆盖用户原密码（P0 严重）

**第78-79行和第119-120行**：当 magic link 验证失败时，代码用 `crypto.randomUUID()` 覆盖用户密码，之后用户无法用原密码登录。

**修复**：改用 `adminClient.auth.admin.generateLink({ type: 'magiclink' })` 后直接提取 `hashed_token` 来验证，或统一使用临时密码方案但在登录成功后**立即恢复原密码**（当前代码第97行有注释但没实现）。

---

## 问题三：非 +86 手机号前端可发验证码请求（P1）

**前端**第86行只校验11位数字格式，但第90行限制了 `countryCode !== '+86'`。如果用户选了 +86 以外的区号但手机号恰好11位，前端校验通过但后端返回错误。体验不一致。

**修复**：前端在 `authMode === 'sms'` 时，根据 `countryCode` 动态调整校验规则，非 +86 时禁用发送按钮并提示"短信验证码仅支持中国大陆手机号"。

---

## 问题四：验证码输入无自动提交（P2 体验）

用户输入满6位后仍需手动点击"登录/注册"按钮，增加一步操作。

**修复**：`smsCode` 长度达到6位时自动触发 `handleSmsLogin`。

---

## 问题五：SMS模式与密码模式共享 `phone` 状态但验证规则不同（P2）

SMS模式要求11位中国手机号，密码模式允许5-15位国际号码。两个 tab 共享同一个 `phone` 状态，切换 tab 时可能导致校验混乱。

**修复**：SMS模式独立校验，或切换到 SMS tab 时如果 `countryCode !== '+86'` 自动重置为 `+86`。

---

## 问题六：验证码过期清理依赖触发器但无定时执行（P3）

`cleanup_expired_verification_codes` 是 INSERT 触发器，只在新插入时清理。如果长时间无人发送验证码，过期数据不会被清理。

**修复**：可忽略（数据量小），或加一个 pg_cron 定时清理。

---

## 修复方案

| 文件 | 改动 |
|------|------|
| `supabase/functions/verify-sms-login/index.ts` | 用 `getUserByEmail` 替换 `listUsers()`；移除临时密码方案，统一用 generateLink + verifyOtp |
| `src/pages/Auth.tsx` | SMS模式下非+86禁用发送；6位验证码自动提交；切换tab时重置countryCode |

### 核心改动详情

**verify-sms-login 重构（第52-106行）**：
```typescript
// Before: listUsers() 全量拉取（有分页限制）
const { data: existingUsers } = await adminClient.auth.admin.listUsers();
const existingUser = existingUsers?.users?.find(...)

// After: 精准查询单个用户
const { data: { users } } = await adminClient.auth.admin.listUsers({
  page: 1, perPage: 1,
});
// 或更好的方案：直接通过邮箱查
const { data: userData } = await adminClient
  .from('profiles')
  .select('id')
  .eq('phone', phone)
  .eq('phone_country_code', countryCode)
  .limit(1)
  .maybeSingle();
```

**移除临时密码，统一登录方式**：对已有用户只用 `generateLink` → `verifyOtp`，失败直接报错而非用临时密码覆盖。

**前端自动提交**：
```typescript
useEffect(() => {
  if (smsCode.length === 6 && agreedTerms && !loading) {
    handleSmsLogin({ preventDefault: () => {} } as React.FormEvent);
  }
}, [smsCode]);
```

