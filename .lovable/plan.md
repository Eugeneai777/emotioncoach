

## Problem Analysis

The WeChat JSAPI payment on `/pay-entry` loops between "微信支付" and "正在处理授权" pages because of two bugs:

### Bug 1: No auto-login after OAuth callback
When `wechat-pay-auth` returns a `tokenHash`, PayEntry passes it in the redirect URL but **never uses it to log in**. Compare with WealthBlockAssessment which properly calls `supabase.auth.verifyOtp()`. Without login, the user remains unauthenticated, and WechatPayDialog can't find their openId in the database.

### Bug 2: OpenId lost before WechatPayDialog can use it
The resume effect simultaneously opens the pay dialog AND clears `payment_openid` from URL params. By the time WechatPayDialog mounts, `resumeOpenId` is already `undefined`. WechatPayDialog then detects WeChat browser with no openId → triggers silent auth again → creates an infinite redirect loop.

## Plan

### 1. Add auto-login with tokenHash in PayEntry
In the payment resume `useEffect`, before opening the pay dialog:
- Check for `payment_token_hash` in URL params
- If present, call `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` to auto-login
- Wait for login to complete before opening the dialog

### 2. Persist openId in React state before URL cleanup
- Add a new state variable `const [cachedOpenId, setCachedOpenId] = useState<string | undefined>()`
- In the resume effect, save `resumeOpenId` to `cachedOpenId` state **before** cleaning URL params
- Pass `cachedOpenId` (instead of `resumeOpenId`) to UnifiedPayDialog's `openId` prop

### 3. Fix auth redirect URL encoding (minor)
Line 155: `navigate(\`/auth?redirect=/pay-entry?partner=${partnerId}\`)` has a URL encoding issue — the `partner` param could be misinterpreted. Use `encodeURIComponent` for the redirect value.

### Files to modify
- `src/pages/PayEntry.tsx` — all three fixes above

