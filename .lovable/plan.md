## 修复目标

修复"男人有劲状态评估"在游客完成测评后,点【一键登录解锁完整报告】的体验:

1. **取消我们自建的"微信登录确认"二次确认页**(用户截图所示)
2. **修复登录后回到 `/mini-app` 而不是测评结果页**

同时**严格不破坏**手机端 H5、微信小程序、电脑端的其他登录/绑定/支付业务。

---

## 现状根因

### 二次确认来自我们自己的中间页

`src/pages/WeChatAuth.tsx` 在微信内置浏览器 + 移动端时,渲染了一张写死的"微信登录确认"卡片(含"仅用于确认你的微信身份"等文案 + "继续微信授权"按钮),需要用户再点一次才会跳到微信官方授权页。这是用户截图里看到的二次确认。

### 登录后回到 `/mini-app` 而不是测评页

- 用户从测评页跳转时,虽然写入了 `localStorage.auth_redirect` 并在 URL 带了 `redirect=`。
- 但是 `WeChatAuth.tsx` 生成微信 OAuth URL 时,`state` 只写了 `mode`(如 `login`),并没有把 redirect 编码进去。
- 微信 OAuth 跳走再跳回 `/wechat-oauth-callback` 时,URL 已经被微信改写,只剩 `code` 和 `state`。
- `WeChatOAuthCallback.tsx` 登录成功后的跳转逻辑里,**完全没有读取 `auth_redirect`**,只读 `post_auth_redirect`,所以最终落到 `navigate('/')` → `SmartHomeRedirect` → `/mini-app`。

另外 `WeChatAuth.tsx` 桌面扫码登录分支硬编码 `window.location.href = '/'`,同样会丢回跳目标。

---

## 实施方案(分端兼容)

### 改动 1:微信内 H5 自动授权,跳过我们自建的"确认"卡片

**文件:** `src/pages/WeChatAuth.tsx`

- 在 `generateMobileAuthUrl` 拿到 `authUrl` 后,**仅当 `mode === 'login'` 且在微信内置浏览器**时,自动 `window.location.replace(authUrl)`。
- 注册模式(`mode=register`)、绑定模式(`bind_xxx`)、非微信浏览器 (`isMobileDevice && !isWeChatBrowser`)、桌面扫码 → **保持现有 UI 不变**。
- 这样手机端 H5 微信里的登录从"按钮 → 我们的确认页 → 微信官方页"压缩为"按钮 → 微信官方页"。其他端、其他模式行为不变。

### 改动 2:把 redirect 透传到微信 OAuth state,并在回调里消费

**文件:** `src/pages/WeChatAuth.tsx`

- 读取 URL `?redirect=`,白名单校验后写入 `localStorage.auth_redirect`(已存在)。
- 拼接 OAuth URL 时,把 state 从 `mode` 改为:
  - `login`(无 redirect 时,保持原值,**对回调端完全向后兼容**)
  - `login__r__<encodeURIComponent(redirectPath)>`(有 redirect 时)
  - `register` / `register_<orderNo>` / `bind_<userId>` 全部不动,逻辑不受影响

**文件:** `src/pages/WeChatOAuthCallback.tsx`

- 登录成功分支(已有 magicLink 验证后)的跳转优先级改为:
  ```text
  1. localStorage.auth_redirect(站内白名单校验,消费后清除)
  2. state 中的 __r__ 段(站内白名单校验)
  3. consumePostAuthRedirect()(已有,支付场景用)
  4. 新用户 → /wechat-auth?mode=follow
  5. 老用户 → "/"
  ```
- 站内白名单校验复用 `Auth.tsx` 里 `isValidRedirect` 同样的规则,提到 `src/lib/postAuthRedirect.ts` 或就地写一个小工具。
- 绑定流程(`isBind`)、未注册分支、错误分支 **完全不动**,保护设置页绑定微信、支付注册等现有业务。

### 改动 3:桌面扫码登录成功后不再硬编码 `/`

**文件:** `src/pages/WeChatAuth.tsx`(`startPolling` 内 `confirmed` 分支)

- 把 `window.location.href = '/'` 改为:
  ```text
  优先 localStorage.auth_redirect → URL ?redirect= → "/"
  使用 navigate(target, { replace: true })
  ```
- 这条路径是 PC 扫码登录,与手机端 H5、小程序无关,但顺带修掉避免之后 PC 入口再爆同样问题。

### 改动 4:小程序端确认无影响

小程序登录走 `supabase/functions/miniprogram-login`(`jscode2session`),不经过 `WeChatAuth.tsx` / `WeChatOAuthCallback.tsx`。本次改动**不触及**该路径,小程序登录行为零变化。

### 改动 5:测评页保持现有恢复逻辑

`src/pages/DynamicAssessmentPage.tsx` 已有 `useEffect` 读取 lite 缓存 → `calculateAndShowResult`(line 226-255),登录回跳后会自动恢复完整结果,无需改动。
仅 review 一遍确认 `_requireAuth=false`(测评页本身允许游客打开)+ 缓存 key 在登录前后一致即可。

---

## 兼容性评估

| 端 / 场景 | 是否影响 | 说明 |
|---|---|---|
| 手机端 H5 微信内 - 登录 | **改善** | 跳过我们自建确认页,直达微信官方授权 |
| 手机端 H5 微信内 - 注册 | 不变 | 仍展示条款确认页 |
| 手机端 H5 微信内 - 绑定 | 不变 | 走 `bind_xxx` state,不进入新分支 |
| 手机端 H5 微信外 | 不变 | 仍展示"复制链接到微信打开"卡片 |
| 微信小程序 | 不变 | 走 `miniprogram-login`,不经过本次文件 |
| 桌面浏览器扫码登录 | **改善** | 登录后回到 redirect 目标而非首页 |
| 设置页绑定微信 | 不变 | `WeChatOAuthCallback` 绑定分支未动 |
| 支付后注册回跳 | 不变 | `consumePostAuthRedirect` 优先级仅下调,但仍在新用户分支前消费 |

---

## 涉及文件

- `src/pages/WeChatAuth.tsx`(自动跳转 + state 透传 redirect + 扫码成功跳回 redirect)
- `src/pages/WeChatOAuthCallback.tsx`(登录成功优先消费 `auth_redirect` / state redirect)

无 schema、RLS、Edge Function、依赖变更。

---

## 验证脚本

1. **微信内 H5(目标场景)**:测评页 → 一键登录 → 直接进微信官方授权 → 回到测评结果页。
2. **微信内 H5 注册**:确认条款页仍显示,流程不变。
3. **微信内 H5 设置页绑定微信**:仍跳到 `/settings?tab=notifications&wechat_bound=success`。
4. **支付场景注册回跳**:`post_auth_redirect` 仍生效。
5. **桌面扫码登录**:从带 `?redirect=` 的页面进入 → 扫码登录后回到原页面。
6. **小程序内登录**:不受影响(冒烟即可)。