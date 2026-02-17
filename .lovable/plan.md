

## 小程序登录优先设定为手机登录

### 当前状态

目前小程序环境中有两个登录入口的默认模式不一致：

| 入口 | 文件 | 当前默认模式 |
|------|------|-------------|
| 主登录页 Auth.tsx | `src/pages/Auth.tsx` | 手机号（已正确） |
| 快速注册弹窗 QuickRegisterStep | `src/components/onboarding/QuickRegisterStep.tsx` | 微信一键登录 |

`QuickRegisterStep.tsx` 第 58-63 行：
```typescript
const getDefaultMode = (): RegisterMode => {
  // 小程序环境保留微信一键登录
  if (isWeChatMiniProgram()) return 'wechat';  // <-- 这里需要改
  // 其他所有环境默认手机号注册
  return 'phone';
};
```

### 修改方案

**修改 `src/components/onboarding/QuickRegisterStep.tsx`**

将 `getDefaultMode` 函数统一返回 `'phone'`，不再为小程序环境特殊处理：

```typescript
const getDefaultMode = (): RegisterMode => {
  // 所有环境统一默认手机号注册（包括小程序）
  return 'phone';
};
```

### 影响范围

- 仅修改 1 个文件中的 1 个函数
- Auth.tsx 主登录页已经默认手机号模式，无需修改
- 用户仍然可以手动切换到微信登录模式，只是默认展示手机号登录
- 不影响支付流程中的小程序 openid 缓存逻辑

