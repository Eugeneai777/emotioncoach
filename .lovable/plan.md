

# 修复构建错误：TypeScript 类型识别问题

## 问题

构建报错 `Property 'shippingInfo' does not exist on type 'WechatPayDialogProps'`，但实际检查代码发现 `WechatPayDialog.tsx`（第 51 行）和 `AlipayPayDialog.tsx`（第 31 行）的接口中**已经包含 `shippingInfo`**。

这是 TypeScript 编译器缓存/类型推断的问题。修复方式：将 `WechatPayDialogProps` 和 `AlipayPayDialogProps` 接口显式 **export**，确保跨文件引用时类型完整可见。

## 修改

| 文件 | 改动 |
|------|------|
| `src/components/WechatPayDialog.tsx` | `interface WechatPayDialogProps` → `export interface WechatPayDialogProps` |
| `src/components/AlipayPayDialog.tsx` | `interface AlipayPayDialogProps` → `export interface AlipayPayDialogProps` |

同时，修复用户反馈的**根本支付问题**：当前微信浏览器中新用户支付流程存在以下隐患：

1. `triggerSilentAuth` 的 5 秒超时只是 UI 回退，但如果 `window.location.href` 赋值后浏览器开始导航又被中断（如微信内嵌浏览器安全策略），用户会看到一个短暂的 spinner 后突然切换到二维码模式，体验割裂
2. **更根本的问题**：微信浏览器中非登录用户走静默授权获取 openId 后，如果数据库中没有 `wechat_user_mappings` 记录（新用户），`useWechatOpenId` hook 返回 undefined → 每次打开支付都重新触发 OAuth 重定向循环

### 根本修复方案

在 `WechatPayDialog` 中，当微信浏览器检测到没有 openId 时，**直接跳过 JSAPI 支付，立即降级为 Native（二维码）支付**，而不是尝试 OAuth 重定向。这样用户体验为：

- 微信浏览器 + 有 openId → JSAPI 支付（最优体验）
- 微信浏览器 + 无 openId → **立即显示二维码**（可用，无卡顿）
- 非微信环境 → 二维码或 H5

修改 `fetchUserOpenId` 中的逻辑：当微信浏览器环境下没有找到 openId（数据库/props/URL 都没有）时，不再调用 `triggerSilentAuth()`，而是直接 `setOpenIdResolved(true)` 让支付流程以 Native 模式继续。

| 文件 | 改动 |
|------|------|
| `src/components/WechatPayDialog.tsx` | 第 453 行：替换 `triggerSilentAuth()` 为直接 resolved + 日志提示 |

