

## 将手机号注册设为默认方式

### 当前状态

- `Auth.tsx`（登录/注册页）：已经默认为手机号模式，无需改动。
- `QuickRegisterStep.tsx`（支付后注册弹窗）：当前逻辑是微信浏览器内默认"微信授权"，PC 端默认"微信扫码"，只有移动端非微信才默认"手机号注册"。

### 改动内容

**文件：`src/components/onboarding/QuickRegisterStep.tsx`**

1. **修改默认模式逻辑**（`getDefaultMode` 函数，约第 58-66 行）：
   - 将所有环境的默认模式改为 `'phone'`（手机号注册）
   - 仅在微信小程序内保留 `'wechat'` 作为默认（因为小程序有一键登录能力）

2. **调整 Tab 顺序**（约第 587-622 行）：
   - 将"手机号注册"移到第一个位置
   - "微信授权/扫码"移到第二个位置
   - "已有账号"保持第三个位置
   - 与截图中的布局一致，但手机号注册优先

### 技术细节

```typescript
// 修改前
const getDefaultMode = (): RegisterMode => {
  const ua = navigator.userAgent.toLowerCase();
  const isWechat = /micromessenger/i.test(ua);
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
  if (isWechat) return 'wechat';
  if (isMobile) return 'phone';
  return 'wechat';
};

// 修改后
const getDefaultMode = (): RegisterMode => {
  // 小程序环境保留微信一键登录
  if (isWeChatMiniProgram()) return 'wechat';
  // 其他所有环境默认手机号注册
  return 'phone';
};
```

Tab 顺序从「微信授权 | 手机号注册 | 已有账号」改为「手机号注册 | 微信授权 | 已有账号」。

