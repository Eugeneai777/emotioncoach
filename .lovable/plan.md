

## 小程序支付 openId 报错修复

### 问题根因

小程序支付流程中存在前后端逻辑不一致：

- **前端**（WechatPayDialog.tsx 第 754 行）：允许在没有 `mp_openid` 的情况下继续创建订单，设计意图是由小程序原生支付页面（`/pages/pay/index`）负责获取 openId 并完成支付
- **后端**（create-wechat-order 第 178 行）：强制要求 `miniprogram` 类型的订单必须传入 `openId`，否则直接抛出错误 `"支付需要 openId（小程序请确保传入 mp_openid）"`

当小程序 WebView 打开页面时，如果 URL 中没有携带 `mp_openid` 参数，且 `sessionStorage` 中也没有缓存，前端会以 `openId=undefined` 调用后端，导致后端报错。

```text
前端流程（当前）：
  选择套餐 → payType=miniprogram, openId=undefined → 调用后端 → 报错 ✗

期望流程：
  选择套餐 → payType=miniprogram, openId=undefined → 后端创建订单
  → 返回 prepay 参数 → navigateTo 小程序原生支付页 → 原生获取 openId
  → 调用 wx.requestPayment → 完成支付 ✓
```

### 修复方案

#### 1. 后端：放宽小程序支付的 openId 校验

**文件：** `supabase/functions/create-wechat-order/index.ts`

- 修改第 178 行的验证逻辑，仅对 `jsapi` 类型强制要求 openId，`miniprogram` 类型允许不传
- 当 `miniprogram` 没有 openId 时，不向微信 JSAPI 接口发请求（因为缺少 payer.openid 必定失败），而是只在数据库中创建订单记录，并返回 orderNo 给前端
- 前端拿到 orderNo 后，通过 `navigateTo` 跳转到小程序原生支付页，由原生端用自己的 openId 重新调用微信支付

具体改动：

```typescript
// 第 178 行：仅 JSAPI 强制要求 openId，小程序允许缺失
if (payType === 'jsapi' && !openId) {
  throw new Error('JSAPI 支付需要 openId');
}

// 第 277 行附近：小程序无 openId 时，跳过微信下单，只创建本地订单
if (isMiniProgramPay && !openId) {
  // 只在数据库中创建订单，不调用微信支付接口
  // 返回 orderNo，由小程序原生端获取 openId 后再发起支付
}
```

#### 2. 后端：新增小程序无 openId 的订单创建分支

当 `payType=miniprogram` 且无 openId 时：
- 生成 orderNo 并写入 orders 表（status=pending）
- 直接返回 `{ success: true, orderNo, payType: 'miniprogram', needsNativePayment: true }`
- 不调用微信支付 API（因为无法调用）

#### 3. 前端：处理 needsNativePayment 响应

**文件：** `src/components/WechatPayDialog.tsx`

- 在 `createOrder` 函数中，当后端返回 `needsNativePayment: true` 时，直接跳转到小程序原生支付页
- 原生支付页需要知道 orderNo、packageName、amount 等信息，通过 URL 参数传递
- 原生端拿到这些信息后，获取 openId，调用后端重新生成 prepay 参数，最后调用 `wx.requestPayment`

---

### 技术细节

#### 后端改动（create-wechat-order/index.ts）

| 位置 | 改动 |
|------|------|
| 第 178 行 | 放宽校验：`payType === 'jsapi' && !openId` 才报错，miniprogram 允许无 openId |
| 第 270-290 行 | 新增分支：miniprogram 无 openId 时，跳过微信 API 调用，仅创建本地订单 |
| 返回数据 | 新增 `needsNativePayment` 字段，告知前端需要走原生支付 |

#### 前端改动（WechatPayDialog.tsx）

| 位置 | 改动 |
|------|------|
| createOrder 函数（约第 800 行） | 处理 `needsNativePayment` 响应：构建参数并跳转到小程序原生支付页 |
| triggerMiniProgramNativePay | 支持传入 packageKey/amount 等额外参数，供原生端重新下单时使用 |

### 文件变更总表

| 文件 | 操作 |
|------|------|
| `supabase/functions/create-wechat-order/index.ts` | 修改 - 放宽 miniprogram openId 校验，新增无 openId 分支 |
| `src/components/WechatPayDialog.tsx` | 修改 - 处理 needsNativePayment 响应 |

