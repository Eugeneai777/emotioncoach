

# /wealth-block 页面在「微信浏览器（公众号 H5）」环境下的微信授权与支付逻辑梳理

> 仅梳理，不改代码。环境判定：`MicroMessenger` 在 UA 中、且非小程序 WebView。

## 一、环境识别（页面初始化）

文件：`src/pages/WealthBlockAssessment.tsx`

```ts
isWeChatBrowserEnv = /MicroMessenger/i.test(ua)
                  && !/miniProgram/i.test(ua)
                  && !window.__wxjs_environment;
```

- `isMiniProgram` = `isWeChatMiniProgram()` → 这里为 `false`，不会进小程序 resume 链路。
- 同时跑 `usePaymentCallback`（监听 H5 支付回调 URL 参数）。

## 二、用户状态分支（点击「立即测评 ¥9.9」时 `handlePayClick`）

| 用户状态 | 微信浏览器分支 |
|---|---|
| 未登录 | 调 `triggerWeChatSilentAuth()` → 跳微信网页授权（snsapi_base 静默） |
| 已登录、未购买 | 直接 `openWealthPayDialog()` → 弹 `AssessmentPayDialog` |
| 已登录、已购买 / 绽放合伙人 | 直接 `setShowIntro(false)` 进测评 |

## 三、微信网页授权链路（未登录用户）

1. 前端 `triggerWeChatSilentAuth`：
   - 在当前 URL 上加 `?assessment_pay_resume=1` 作为回跳 URL
   - 调 edge function `wechat-pay-auth`，body：`{ redirectUri, flow: 'wealth_assessment' }`
   - 后端返回 `authUrl`（即 `https://open.weixin.qq.com/connect/oauth2/authorize?...&scope=snsapi_base&state=...`）
   - `window.location.href = authUrl`
2. 微信回跳 → 公众号回调 edge function 解 `code → openId`，并：
   - 若 openId 已有绑定账号：生成 `payment_token_hash`（magic link），随 `payment_openid`、`pay_flow` 拼回页面
   - 若未绑定：仍带 `payment_openid` 回页面
   - 若失败：带 `payment_auth_error=1`
3. 页面 `useEffect handleWeChatPayAuthReturn` 解析 URL 参数：
   - **缓存 openId**：写入 3 个 key 兜底匹配 `WechatPayDialog`：
     - `sessionStorage.wechat_payment_openid`
     - `localStorage.cached_payment_openid_gzh`
     - `sessionStorage.cached_payment_openid_gzh`
   - **自动登录**：若有 `payment_token_hash` → `supabase.auth.verifyOtp({type:'magiclink'})`
   - **清理 URL 参数**，避免重复触发
   - 登录态就绪 + 未购买 → 自动 `openWealthPayDialog()` 续上支付

## 四、支付弹窗内部分流（`AssessmentPayDialog`）

OpenID 解析顺序（`getPaymentOpenId`）：
1. URL: `payment_openid` / `openid` / `openId` / `mp_openid`
2. `sessionStorage.wechat_payment_openid`

### 在微信浏览器环境的支付方式选择
- 有 `userOpenId`（公众号 openId 已就绪）→ `payType = 'jsapi'`，调 `create-wechat-order`，返回的 `payParams` 通过 `WeixinJSBridge.invoke('getBrandWCPayRequest', ...)` 唤起微信内支付
- 无 `userOpenId`（授权失败兜底）→ 触发一次 `wechat-pay-auth` 静默授权重试；若仍失败 → 降级 `payType = 'h5'`（生成 mweb_url，不在微信内是直链；在微信内会被拦截，所以兼有扫码二维码 fallback）
- 桌面微信（PC 微信浏览器）：归到 `native`，渲染收款二维码

### 双轨支付完成检测
| 通道 | 触发 |
|---|---|
| JSAPI 回调 | `WeixinJSBridge.invoke` 的 `res.err_msg === 'get_brand_wcpay_request:ok'` |
| 后端轮询 | `startPolling(orderNo)` → 周期调 `check-order-status`，命中 `status='paid'` 即成功 |
| URL 回调 | `usePaymentCallback` 监听 H5 支付返回 URL（兜底） |

## 五、支付成功后

- `setShowPayDialog(false)`、`setShowIntro(false)`，进入测评
- 后端 `wechat-pay-callback` 已写入 `orders.status='paid'`
- 页面 `onAuthStateChange('SIGNED_IN')` 二次校验 `orders` 表防漏判（场景：先支付后登录）

## 六、关键防御机制（已落实，不需改）

1. **防重复授权**：`silentAuthTriggeredRef`、`pay_auth_in_progress` sessionStorage 标记
2. **防订单复用 / 取消后卡死**：`MP_POST_CANCEL_FLAG_KEY` + `cancel-pending-order` edge fn（小程序场景为主，浏览器同样写入埋点）
3. **三 key 缓存兜底**：避免 `WechatPayDialog` 与 `WealthBlockAssessment` 因 cache key 不一致循环授权
4. **登录回跳续付费**：`sessionStorage.wealth_block_pending_pay='1'` 标记 + 登录后 useEffect 自动重开弹窗
5. **埋点**：`trackPaymentEvent('payment_cancelled' / 'payment_success')`、`useWealthCampAnalytics`

## 七、整条链路时序（微信浏览器，未登录新用户）

```text
点击 [立即测评 ¥9.9]
   │
   ▼
isWeChatBrowserEnv && !user
   │
   ▼
wechat-pay-auth (edge) → authUrl
   │
   ▼
微信 OAuth (snsapi_base) → 回跳 ?assessment_pay_resume=1
                                &payment_openid=...
                                &payment_token_hash=...
   │
   ▼
verifyOtp(magiclink) → Supabase 登录态建立
   │
   ▼
缓存 openId 三 key → openWealthPayDialog()
   │
   ▼
AssessmentPayDialog: payType=jsapi
create-wechat-order (with openId, userId)
   │
   ▼
WeixinJSBridge.invoke(getBrandWCPayRequest)  ←→  startPolling(check-order-status)
   │                                                    │
   └──────── 成功 ─────────► onSuccess ───────► 进入测评
```

## 八、潜在改进点（仅列出，不实施）

- 微信 PC 桌面浏览器目前走 `native` 二维码，但 `isWeChatBrowserEnv` 也会命中 PC 微信内置浏览器，建议显式区分以减少授权 redirect 的无效跳转
- `payment_token_hash` 失败时直接弹窗用扫码兜底；可增加一次"重试静默授权"按钮，提升 conversion
- `wechat_payment_openid` 与 `cached_payment_openid_gzh` 三 key 同步可抽成统一工具函数，降低后续新页面接入成本

