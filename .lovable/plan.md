

# 微信支付循环跳转问题修复计划

## 问题诊断

### 用户描述
> 在微信里一直跳转到产品按钮

### 根本原因
`/packages` 页面缺少对 `payment_resume` 参数的监听，导致微信静默授权后无法自动恢复支付弹窗，用户陷入循环。

### 完整问题链路

```text
用户点击购买
     ↓
WechatPayDialog 检测无 openId
     ↓
触发 triggerSilentAuth()
     ↓
跳转微信授权页
     ↓
授权成功，/pay-entry 换取 openId
     ↓
重定向回 /packages?payment_resume=1&payment_openid=xxx
     ↓
❌ Packages.tsx 没有监听这些参数！
     ↓
弹窗没有自动打开，用户再次点击
     ↓
重复循环...
```

---

## 修复方案

### 核心改动：Packages.tsx 新增支付恢复逻辑

在 `Packages.tsx` 中添加对以下 URL 参数的监听：

| 参数 | 作用 |
|------|------|
| `payment_resume=1` | 标记需要恢复支付流程 |
| `payment_openid` | 静默授权获取的 openId |
| `payment_auth_error` | 授权失败标记 |

### 实现逻辑

```typescript
// 1. 读取 URL 参数
const paymentResume = searchParams.get('payment_resume') === '1';
const paymentOpenId = searchParams.get('payment_openid');
const paymentAuthError = searchParams.get('payment_auth_error') === '1';

// 2. 从 sessionStorage 恢复选中的套餐
const cachedPackage = sessionStorage.getItem('pending_payment_package');

// 3. 自动打开支付弹窗
useEffect(() => {
  if (paymentResume && cachedPackage && !paymentAuthError) {
    const pkg = JSON.parse(cachedPackage);
    setSelectedPackage(pkg);
    setPayDialogOpen(true);
    
    // 清理 URL 参数
    const url = new URL(window.location.href);
    url.searchParams.delete('payment_resume');
    url.searchParams.delete('payment_openid');
    window.history.replaceState({}, '', url.toString());
    
    // 清理缓存
    sessionStorage.removeItem('pending_payment_package');
  }
}, [paymentResume, cachedPackage, paymentAuthError]);
```

### WechatPayDialog.tsx 改动

触发静默授权前，需要缓存当前选中的套餐：

```typescript
// triggerSilentAuth 前保存套餐信息
if (packageInfo) {
  sessionStorage.setItem('pending_payment_package', JSON.stringify(packageInfo));
}
```

### 传递 openId 给弹窗

```typescript
<WechatPayDialog
  open={payDialogOpen || isPaymentCallback}
  packageInfo={selectedPackage}
  openId={paymentOpenId || undefined}  // 新增：传递静默授权获取的 openId
  onSuccess={handlePaymentSuccess}
/>
```

---

## 技术实现细节

### 修改文件

| 文件 | 改动内容 |
|------|----------|
| `src/pages/Packages.tsx` | 新增 `payment_resume` 监听和自动恢复逻辑 |
| `src/components/WechatPayDialog.tsx` | 触发静默授权前缓存套餐信息到 sessionStorage |

### 完整改动清单

**Packages.tsx:**
1. 新增 `useSearchParams` 读取 URL 参数
2. 新增 `paymentResume`、`paymentOpenId`、`paymentAuthError` 状态
3. 新增 `useEffect` 监听支付恢复场景
4. 修改 `WechatPayDialog` 组件传入 `openId` prop
5. 清理 URL 参数避免刷新后重复触发

**WechatPayDialog.tsx:**
1. 在 `triggerSilentAuth()` 开始时，将当前 `packageInfo` 存入 sessionStorage
2. 授权成功后自动读取缓存的套餐信息

---

## 授权失败处理

如果 `payment_auth_error=1`：
- 不自动打开弹窗
- 显示 toast 提示"授权失败，请重试"
- 让 `WechatPayDialog` 降级使用扫码支付

---

## 预期效果

修复后的用户流程：

```text
用户点击购买 365 会员
     ↓
WechatPayDialog 缓存套餐信息到 sessionStorage
     ↓
触发静默授权，跳转微信
     ↓
授权成功，带着 payment_openid 回到 /packages
     ↓
✅ Packages.tsx 检测到 payment_resume=1
     ↓
从 sessionStorage 恢复套餐信息
     ↓
自动打开 WechatPayDialog（已有 openId）
     ↓
直接调起 JSAPI 支付弹窗
     ↓
用户完成支付
```

---

## 兼容性考虑

1. **已登录用户**：数据库有 openId 时不触发授权，直接支付
2. **授权失败**：降级为扫码支付
3. **刷新页面**：缓存使用 sessionStorage，刷新后清空
4. **多次点击**：使用 ref 防止重复触发

