

## 兑换流程中让新用户默认进入注册页面并填写昵称

### 问题

当前从 Claim 页面点击"免费领取"跳转到 `/auth?redirect=/claim?partner=xxx` 时，Auth 页面默认显示**登录**模式（`isLogin = true`）。昵称输入框只在**注册**模式下显示，因此新用户看不到昵称输入框。

### 方案

1. **Claim 页面跳转时加参数**：在 `Claim.tsx` 的 `handleClaim` 中，跳转 auth 时追加 `&register=true` 参数，提示 Auth 页面默认展示注册模式。

2. **Auth 页面识别参数**：在 `Auth.tsx` 初始化 `isLogin` 状态时，检查 `register=true` 参数，如果存在则默认进入注册模式（`isLogin = false`），让用户可以填写昵称。

3. **保留 placeholder 不变**：根据用户要求，不修改 placeholder，保持之前的改动"AI教练会用这个名字称呼你"和 maxLength 20。

### 具体改动

#### 1. `src/pages/Claim.tsx`（约第155行）

将跳转 URL 从：
```
/auth?redirect=...
```
改为：
```
/auth?register=true&redirect=...
```

#### 2. `src/pages/Auth.tsx`（约第56行）

将：
```typescript
const [isLogin, setIsLogin] = useState(isPhoneOnly ? false : true);
```
改为：
```typescript
const isRegisterMode = searchParams.get('register') === 'true';
const [isLogin, setIsLogin] = useState(isPhoneOnly || isRegisterMode ? false : true);
```

这样从兑换页跳转过来的用户会直接看到注册表单，包含昵称输入框，填写后注册并自动跳回领取页完成领取。

