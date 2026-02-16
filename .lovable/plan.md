

# 修复分享卡片加载不出来的问题

## 问题分析

分享卡片停留在骨架屏（loading skeleton）状态，无法显示实际内容。

根本原因在 `WealthInviteCardDialog.tsx` 的用户数据加载逻辑中：

1. 弹窗打开时，`isLoadingUser` 设为 `true`，触发骨架屏显示
2. `fetchUserInfo` 函数调用 `supabase.auth.getUser()` 获取用户信息
3. 在微信 WebView 环境下，如果用户未登录或 auth 请求挂起/超时，`getUser()` 可能长时间无响应
4. 虽然有 `finally` 块来设置 `setIsLoadingUser(false)`，但如果请求本身卡住，`finally` 也无法执行
5. 结果：卡片永远停留在 skeleton 状态

## 修改方案

### 文件：`src/components/wealth-camp/WealthInviteCardDialog.tsx`

1. **添加超时保护**：给整个 `fetchUserInfo` 加一个 5 秒超时，超时后强制结束 loading 状态，显示默认数据的卡片

2. **未登录时显示默认卡片**：当用户未登录时，不阻止卡片渲染，而是使用默认占位数据（默认头像、默认名称"财富探索者"、默认分数）

3. **加 loading 超时兜底**：在 `useEffect` 中加一个独立的 setTimeout，无论 fetch 结果如何，最多 6 秒后强制 `setIsLoadingUser(false)`

### 具体改动

```typescript
// 在 fetchUserInfo 的 useEffect 中添加超时兜底
useEffect(() => {
  if (!open) return;
  setIsLoadingUser(true);

  // 超时兜底：最多 5 秒后强制结束 loading
  const timeoutId = setTimeout(() => {
    setIsLoadingUser(false);
  }, 5000);

  const fetchUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // 未登录也显示卡片，使用默认数据
        setIsLoadingUser(false);
        return;
      }
      // ... 其余逻辑不变
    } catch (err) {
      console.error('[WealthInviteCardDialog] Failed to fetch user info:', err);
    } finally {
      setIsLoadingUser(false);
      clearTimeout(timeoutId);
    }
  };

  fetchUserInfo();
  return () => clearTimeout(timeoutId);
}, [open, campId, propCurrentDay]);
```

这样即使在微信环境下请求卡住，卡片也能在 5 秒后正常显示。
