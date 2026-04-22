

## 问题：微信支付订单为什么会归属到错的账户

### 一、根因（已通过日志和代码确认）

`create-wechat-order` 边缘函数在收到下单请求时，对 `userId` 的判定优先级有缺陷：

```text
前端传入参数               后端处理逻辑
─────────────────         ──────────────────────────────
userId: "guest"           → 走"游客分支"
+ openId: "ofx5..."       → 用 openId 反查 wechat_user_mappings
                          → 命中历史绑定的 user A
                          → 把订单 user_id 写成 user A
                          ⚠ 完全没有校验 Authorization JWT 里的当前登录用户 user B
```

**真实场景还原（用户 18190190026）：**

1. 浏览器历史上某次"神经蛙"微信号 OAuth 登录，留下 `openid → user A(神经蛙)` 的映射
2. 这次 18190190026（user B）用手机号登录本站，但前端在调 `create-wechat-order` 时传的是：
   - `userId: "guest"`（前端误判 / 状态丢失 / 未读 user.id）
   - `openId: <浏览器残留的神经蛙 openid>`
3. 后端只信 openId，订单归属到 user A
4. 即便支付成功，权益也写到 user A 名下，user B 永远看到"未购买"

### 二、为什么会触发"游客 + 残留 openId"

`useWechatOpenId` 把 openid 持久化到 **localStorage** (`cached_wechat_openid`)，只在 `SIGNED_OUT` 时清除。换号场景下：
- 用户 A 在该浏览器登录过 → openid 存入 localStorage
- 用户 A 没点"退出登录"，直接关闭页面
- 用户 B 在同一浏览器用手机号登录 → localStorage 里仍是 A 的 openid
- 支付组件可能因为加载时序拿不到最新 user.id，传 `userId: "guest"` + 旧 openid

### 三、影响范围

| 场景 | 风险 |
|---|---|
| 共用浏览器 / 换号 | 订单和权益错挂到他人账户 |
| 微信内未及时同步登录态 | 同上 |
| 任何走 `userId: "guest" + openId` 路径的下单 | 同上 |
| 涉及函数 | `create-wechat-order`、所有调用它的支付入口（测评、训练营、合伙人、商城） |

### 四、修复方案

**修复 1：后端强一致性校验（`supabase/functions/create-wechat-order/index.ts`）**

在 `userId === "guest"` 分支增加 JWT 校验：
- 解析请求 `Authorization` header 拿到当前登录 user C
- 若 user C 存在且 ≠ openId 反查到的 user A → **拒绝下单**，返回 `AUTH_MISMATCH`，前端提示"账号与微信不一致，请刷新或重新登录"
- 若 user C 存在且 = user A → 放行
- 若无 JWT（真游客）→ 维持现有逻辑

**修复 2：前端登录态优先（3 个支付入口）**

`WealthCampIntro.tsx` / `WealthAssessmentLite.tsx` / `WechatPayDialog.tsx` / `useDynamicAssessmentPurchase.ts`：
- 下单前 `await supabase.auth.getUser()` 取最新 user.id，**有 user.id 就一定传真实 userId，绝不传 "guest"**
- 未登录则强制跳 `/auth?redirect=...`，登录回来后通过 `payment-resumption-pattern-zh` 恢复支付

**修复 3：openId 缓存与登录态同步（`src/hooks/useWechatOpenId.ts`）**

- 监听 `SIGNED_IN`：若新登录用户的 `wechat_user_mappings.system_user_id` 与缓存的 openid 不匹配，**立即清空缓存并重拉**
- 当前逻辑只在 `SIGNED_OUT` 清缓存，不足以应对换号

### 五、实施清单

| 文件 | 改动 |
|---|---|
| `supabase/functions/create-wechat-order/index.ts` | 游客分支增加 JWT vs openId 一致性校验，不一致返回 `AUTH_MISMATCH` |
| `src/hooks/useWechatOpenId.ts` | `SIGNED_IN` 时校验 openid 归属，错配则清缓存重拉 |
| `src/components/WechatPayDialog.tsx` | 下单前 `getUser()` 兜底，禁止传 `userId: "guest"` |
| `src/pages/WealthCampIntro.tsx` | 同上；移除前端 `user_camp_purchases.insert` |
| `src/pages/WealthAssessmentLite.tsx` | 同上 |
| `src/hooks/useDynamicAssessmentPurchase.ts` | 同上 |
| 前端通用错误提示 | 捕获 `AUTH_MISMATCH` → toast"账号与当前微信不一致，请刷新页面" |

### 六、技术细节

- **JWT 解析**：复用 `src/lib/edgeFunctionError.ts` 同等模式，从 `req.headers.get('Authorization')` 提取 Bearer token，调 `supabaseAdmin.auth.getUser(token)` 拿 user
- **错误码标准**：沿用现有 `extractEdgeFunctionError` 中文化错误链路（参考 `edge-function-error-standard-zh`）
- **回归点**：JSAPI（公众号）、Native（PC 扫码）、小程序 H5、合伙人下单、训练营下单、测评下单 6 路必须联调
- **不影响**：真匿名游客（无 JWT）下单流程保持不变

### 七、工时

| 阶段 | 工时 |
|---|---|
| 后端 JWT 一致性校验 + 错误码 | 0.4 天 |
| 前端 4 个入口去 "guest" + 错误提示 | 0.6 天 |
| openId 缓存 SIGNED_IN 校验 | 0.2 天 |
| 6 路支付链路联调 | 0.6 天 |
| **合计** | **1.8 天** |

### 八、确认选项

- 🅰 **同意按此 3 项整体实施**（后端校验 + 前端去 guest + openId 缓存校验）
- 🅑 **仅做修复 1（后端）**：风险最低，前端旧版本仍可能误传，但后端会拦下
- 🅒 **仅做修复 2+3（前端）**：不动后端，存在被绕过的可能
- 🅓 **暂不修代码**，先人工通知 18190190026 用户清浏览器缓存重新下单

