

## 问题分析

`cached_payment_openid` 存储在 `localStorage` 中，当前的清理逻辑依赖 `useWechatOpenId` hook 中的 `SIGNED_OUT` 事件监听。但该 hook 仅在少数页面挂载（HealthStoreGrid、ZhileProductsPage），如果用户从其他页面退出登录，缓存不会被清除。

下次登录的新账号会复用旧账号的 OpenID，导致支付异常。

## 修复方案

### 1. 在 `useAuth.tsx` 的 signOut 中统一清理所有 OpenID 缓存

在 `signOut` 函数中，退出前清除所有微信相关的本地缓存。这是全局入口，无论从哪个页面退出都会执行。

```typescript
const signOut = async () => {
  // 清除微信 OpenID 缓存，防止账号切换后复用旧 OpenID
  localStorage.removeItem('cached_wechat_openid');
  sessionStorage.removeItem('cached_wechat_openid');
  localStorage.removeItem('cached_payment_openid');
  sessionStorage.removeItem('cached_payment_openid');
  await supabase.auth.signOut();
};
```

### 2. 保留 `useWechatOpenId.ts` 中的 SIGNED_OUT 清理作为兜底

不删除现有逻辑，作为双重保障（例如 token 过期导致的自动登出场景）。

### 3. 处理直接调用 `supabase.auth.signOut()` 的地方

`StoryCoach.tsx` 和 `CoachVoiceChat.tsx` 直接调用了 `supabase.auth.signOut()` 而非 `useAuth().signOut()`。需要统一改为使用 `useAuth` 的 `signOut`，或在这些位置也加上缓存清理。

---

**涉及文件**：
- `src/hooks/useAuth.tsx` — signOut 函数增加缓存清理
- `src/pages/StoryCoach.tsx` — 改用 useAuth 的 signOut
- `src/components/coach/CoachVoiceChat.tsx` — 在 signOut 前清理缓存

