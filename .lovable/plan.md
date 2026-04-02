

# 优化未登录兑换码跳转：直接导航到登录页

## 问题

用户未登录时点击"去登录"，当前行为是在兑换弹窗之上再弹出一个注册弹窗（两层 Dialog 叠加），体验割裂。应该直接跳转到 `/auth` 登录页，登录成功后自动返回。

## 方案

修改 `src/pages/SynergyPromoPage.tsx` 中的 `handleRedeemNeedLogin` 函数：

1. **保留**：缓存兑换码到 `localStorage` + 设置 `postAuthRedirect` 回跳地址
2. **改为**：关闭兑换弹窗，使用 `navigate('/auth')` 跳转登录页，而非 `setStep('register')` 弹出内嵌注册弹窗
3. 登录成功后，`postAuthRedirect` 机制会将用户带回 `/promo/synergy` 页面
4. 回到页面后，现有的 `useEffect`（第315-320行）检测到 `user + pendingRedeemCode`，自动重新打开兑换弹窗

### 具体改动

```typescript
// handleRedeemNeedLogin 改为：
const handleRedeemNeedLogin = (code: string) => {
  setPendingRedeemCode(code);
  localStorage.setItem('pending_redeem_code', code);
  setPostAuthRedirect(window.location.pathname + window.location.search);
  setShowRedeemDialog(false);  // 关闭兑换弹窗
  navigate('/auth');            // 直接跳转登录页
};
```

可选清理：如果 `step === 'register'` 的注册弹窗不再有其他入口使用，可以一并移除该弹窗代码（第1034-1048行）。

### 文件变更

| 文件 | 操作 |
|---|---|
| `src/pages/SynergyPromoPage.tsx` | 修改 `handleRedeemNeedLogin`：跳转 `/auth` 而非弹窗；可选移除内嵌注册弹窗 |

