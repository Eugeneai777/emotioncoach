

# 绽放合伙人批量注册强制手机号方案

## 问题

当绽放合伙人通过邀请链接（`/invite/:code`）跳转到注册页面（`/auth`）时，用户可以选择邮箱或微信注册。但自动匹配逻辑依赖 `profiles.phone` 字段，如果用户不用手机号注册，系统无法自动匹配邀请并发放权益。

## 方案

通过 URL 参数传递"强制手机注册"标志，在 Auth 页面检测到该标志时：
- 隐藏邮箱登录切换入口
- 隐藏微信注册按钮
- 默认锁定为手机号注册模式
- 仅保留手机号注册/登录 + 登录切换

## 具体改动

### 1. PartnerInvitePage.tsx
- 修改跳转 URL，从 `/auth?redirect=/invite/{code}` 改为 `/auth?redirect=/invite/{code}&mode=phone_only`

### 2. Auth.tsx
- 读取 URL 参数 `mode=phone_only`
- 当 `mode=phone_only` 时：
  - 强制 `authMode` 为 `'phone'`，不允许切换到邮箱模式
  - 隐藏"之前用邮箱注册？"切换按钮
  - 隐藏"使用微信注册/登录"按钮
  - 默认显示注册表单（`isLogin = false`）
  - 页面顶部添加提示文案："请使用手机号注册，以便系统自动为您发放绽放合伙人权益"

---

### 技术细节

**PartnerInvitePage.tsx** - 第 95 行修改：
```typescript
// 之前
navigate('/auth?redirect=/invite/' + code);
// 之后
navigate('/auth?redirect=/invite/' + code + '&mode=phone_only');
```

**Auth.tsx** - 核心变更：
```typescript
// 读取 URL 参数
const urlParams = new URLSearchParams(window.location.search);
const forcePhoneOnly = urlParams.get('mode') === 'phone_only';

// 强制手机模式
if (forcePhoneOnly) {
  setAuthMode('phone');
  setIsLogin(false); // 默认注册
}
```

UI 条件隐藏：
- 邮箱切换按钮：`{!forcePhoneOnly && authMode === 'phone' && (...)}`
- 微信登录按钮：`{!forcePhoneOnly && (...)}`
- 添加提示横幅：当 `forcePhoneOnly` 时显示"请使用手机号注册以领取绽放合伙人权益"

**影响范围**：仅影响从邀请链接跳转来的注册流程，不影响正常用户的注册登录体验。

