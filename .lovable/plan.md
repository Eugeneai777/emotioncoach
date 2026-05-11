## 问题定位

`/my-page` 点击"退出登录"时，代码只跳转到 `/auth?signing_out=1`，**没有携带 `redirect` 参数**（`src/pages/MyPage.tsx` 第 143 行）。

之后用户用手机号+密码重新登录，`src/pages/Auth.tsx`（第 263-298 行）的跳转优先级为：
1. `auth_redirect`（localStorage） → 无
2. URL `?redirect=` 参数 → 无
3. `post_auth_redirect`（支付场景） → 无
4. **兜底**：查询 `profiles.preferred_coach`，命中 `emotion` 就跳到 `/emotion-coach`

所以登录后跳到了情绪教练页，而不是 `/my-page`。

## 修复方案（仅前端 UI 行为，最小改动）

修改 `src/pages/MyPage.tsx` 的"退出登录"分支：在跳转 `/auth` 时把当前页面带上作为 `redirect` 参数，让 Auth 页登录成功后回到 `/my-page`（或当前任何路径，更通用）。

```ts
case "退出登录": {
  sessionStorage.setItem('signing_out', '1');
  const back = encodeURIComponent(location.pathname + location.search);
  navigate(`/auth?signing_out=1&redirect=${back}`);
  setTimeout(() => {
    signOut()
      .then(() => toast({ title: "已退出登录" }))
      .catch(() => toast({ title: "退出失败，请稍后重试", variant: "destructive" }))
      .finally(() => sessionStorage.removeItem('signing_out'));
  }, 0);
  break;
}
```

Auth.tsx 已有的逻辑会：
- 进入 `/auth` 时把 URL 上的 `redirect` 写入 `localStorage.auth_redirect`（已通过 `isValidRedirect` 校验，安全）
- 登录成功后优先消费 `auth_redirect`，因此返回 `/my-page`，不再走 `preferred_coach` 兜底分支

## 不改动的部分

- 不修改 Auth.tsx 的 `preferred_coach` 兜底逻辑（其他直接进入 `/auth` 的入口仍按偏好教练分流）
- 不修改 `useAuth`、`SmartHomeRedirect`、`postAuthRedirect` 等通用模块

## 验证

1. 在 `/my-page` 点退出登录 → URL 变为 `/auth?signing_out=1&redirect=%2Fmy-page`
2. 输入手机号+密码登录 → 返回 `/my-page`，而不是 `/emotion-coach`
3. 其他登录入口（首页、分享落地页等）行为不变