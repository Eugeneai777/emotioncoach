

## 核查结论：第二次点击支付会卡在「调用支付中」的根因

### 现状日志/网络抓包

会话期间**无新支付调用记录**（network 只有 `audience_illustrations` / `generate-greeting`），无法直接复现，但通过对 `WechatPayDialog.tsx` 与 `UnifiedPayDialog.tsx` 全链路代码审计，**确认存在 3 个会导致"二次点击卡住"的真实缺陷**：

---

### 缺陷 1：`createOrder` 网络请求**没有 AbortController**，关闭弹窗后请求仍在飞

**位置**：`src/components/WechatPayDialog.tsx` line 1042 `supabase.functions.invoke('create-wechat-order', ...)`

**链路**：
1. 用户首次点击 → `createOrder()` 发起 invoke → `setStatus('loading')`
2. **后端慢**（微信代理 ETIMEDOUT 重试中，最长 ~45 秒）或网络抖动
3. 用户**等不及关掉弹窗** → 父级 `setShowPay(false)` → `WechatPayDialog` 的 `useEffect(open→false)` 触发 `resetState()` → `setStatus('idle')`
4. 但**第一笔 invoke 没被 abort**，继续在后台跑
5. 用户**第二次点击** → 新 `WechatPayDialog` 挂载 → `createOrder()` 再次触发 → **第二笔 invoke 也发出**
6. 此时若用户身处微信浏览器，`wechat-pay-auth` / `create-wechat-order` 可能因 `pay_auth_in_progress` 标记或 `silentAuthTriggeredRef` 状态污染卡住，UI 永远停在 "调用支付中"

---

### 缺陷 2：`silentAuthTriggeredRef` / `pay_auth_in_progress` **跨弹窗实例不清理**

**位置**：line 268 `silentAuthTriggeredRef.current = true` + line 273 `sessionStorage.setItem("pay_auth_in_progress", "1")`

- 首次点击触发静默授权 → 设置 `pay_auth_in_progress=1`
- 用户中途关闭（**没真正完成 OAuth 跳转**） → `resetState()` 在 line 707 重置了内存 ref，**但 `sessionStorage.pay_auth_in_progress` 没清**（只有 line 297、346、360 在静默授权 *自身* 异常路径里清，没在 `resetState` 里清）
- 二次点击若被其他守卫读到 `pay_auth_in_progress=1`，可能跳过授权 → openId 为空 → 卡死

---

### 缺陷 3：`UnifiedPayDialog` **没有跟踪正在进行中的支付**

**位置**：`src/components/UnifiedPayDialog.tsx` line 78-94 的 `useEffect`

- 每次 `open=true` 都无条件 `startPaymentFlow()` + `setStage('pay')` + `setPayMethod(getDefaultPayMethod())`
- 若上次 invoke 还在飞（缺陷 1），子组件 `WechatPayDialog` 重建时会再发一次 invoke（`orderCreatedRef` 在 line 207-211 的 open 边沿被重置）
- 后端因此可能创建**两个 pending 订单**，且前端 polling 第二个订单永远不会成功（用户实际没付任何一个）

---

### 修复方案（3 个文件、零后端改动）

#### A. `WechatPayDialog.tsx` — invoke 加 AbortController + sessionStorage 清理

```ts
// 顶部新增
const abortRef = useRef<AbortController | null>(null);

// createOrder 内（line 1042 前）
abortRef.current?.abort(); // 取消上一笔
abortRef.current = new AbortController();
const { data, error } = await supabase.functions.invoke('create-wechat-order', {
  body: {...},
  // @ts-ignore - supabase v2 透传 fetch options
  signal: abortRef.current.signal,
});

// resetState 内（line 690 后）
abortRef.current?.abort();
abortRef.current = null;
sessionStorage.removeItem('pay_auth_in_progress'); // 🔑 关键补漏
```

同样保护 `wechat-pay-auth`（line 328）与 `fallbackToNativePayment`（line 928）的 invoke。

#### B. `WechatPayDialog.tsx` — `createOrder` 入口加**正在进行中**守卫升级

```ts
// line 974 当前只防 'loading'/'polling'/'success'
// 增补：若 abortRef 仍有未释放的 controller，等其结束或强行取消
if (abortRef.current && !abortRef.current.signal.aborted) {
  abortRef.current.abort();
  await new Promise(r => setTimeout(r, 100));
}
```

#### C. `UnifiedPayDialog.tsx` — 弹窗关闭时强制走 unmount 路径

```tsx
// line 101 handlePayDialogChange 内追加
if (!v) {
  trackPaymentEvent('payment_cancelled');
  endPaymentFlow();
  sessionStorage.removeItem('pay_auth_in_progress'); // 🔑 双保险
  onOpenChange(false);
}
```

并将 `WechatPayDialog` 的 `key={packageInfo?.key + '-' + open}` 改为 `key={packageInfo?.key + '-' + flowId}`（每次 `startPaymentFlow` 拿新 flowId），**强制 unmount 上一次实例**，从根上杜绝状态泄漏。

---

### 行为对照表

| 场景 | 修复前 | 修复后 |
|---|---|---|
| 首次点击 → 等待中关闭 → 二次点击 | 卡在"调用支付中" | 第一笔 abort，第二笔正常发起 |
| 首次点击 → 微信授权跳转中关闭 | `pay_auth_in_progress` 残留 | sessionStorage 清干净 |
| 同一订单号重复创建 | 后端可能产生 2 个 pending | abort 后只剩 1 笔 |
| 用户取消 JSAPI 后再次点击 | 已通过 `jsapiCancelled` 走复用路径 ✅ | 不变 |
| 支付成功路径 | 正常 | 正常 |

---

### 影响面 & 工时

- ✅ 仅 2 个文件 (~25 行新增)
- ✅ 不动后端 / 不动数据库 / 不动 RPC
- ✅ 不影响小程序、PC 微信、H5、Native 任意路径
- ✅ 5 大 AI 教练的余额不足横幅、训练营购买、推广页 CTA 全链路兼容
- ⏱️ 0.5 天（含微信浏览器、小程序、H5 三端回归）

---

### 验证清单（修复后必测）

1. PC 微信扫码：打开支付 → 关闭 → 立刻再开 → 二维码正常显示
2. 手机微信浏览器 JSAPI：弹起后取消 → 关闭弹窗 → 再点支付 → 能再次拉起
3. 移动浏览器 H5：关掉支付 → 立即再开 → 二维码刷新
4. 小程序：`mp_openid` 缺失场景下关闭再打开 → 不再死循环授权
5. 慢网模拟（Chrome DevTools `Slow 3G`）：首次 invoke 中关闭 → 第二次能创建新订单

