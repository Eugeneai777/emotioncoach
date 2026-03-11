

# 修复商城支付流程（微信浏览器内无法完成支付）

## 问题根因

从截图和代码分析，支付卡在"正在调起支付..."的原因是：

**微信浏览器内 JSAPI 支付需要 `openId`，但 `HealthStoreGrid` 和 `ZhileProductsPage` 都没有传 `openId` 给 `UnifiedPayDialog`。**

当 `WechatPayDialog` 发现没有 openId 时，会触发静默授权重定向（跳转微信 OAuth 页面），导致：
- 页面刷新，所有 React 状态丢失（已选商品、收货信息、支付弹窗状态）
- 用户回到页面后什么都没发生，支付链路断裂

## 修复方案

### 1. 创建 `useWechatOpenId` Hook

新建 `src/hooks/useWechatOpenId.ts`，在微信浏览器环境下从数据库预加载 openId：
- 检测是否在微信环境
- 已登录用户：从 `wechat_user_mappings` 表查询 openId
- 缓存到 state 中，避免重复查询

### 2. 修复 `HealthStoreGrid.tsx`

- 引入 `useWechatOpenId` hook
- 将 openId 传给 `UnifiedPayDialog`
- 在 checkout 阶段用 sessionStorage 暂存 selectedProduct 和 checkoutInfo，防止重定向后丢失
- 页面加载时检查是否有 `payment_resume` 参数，恢复购买状态

### 3. 修复 `ZhileProductsPage.tsx`

- 同样引入 `useWechatOpenId` 并传给 `UnifiedPayDialog`
- 暂存 checkoutInfo 到 sessionStorage

### 4. 修复 `UnifiedPayDialog.tsx`

- 接收并透传 `openId` prop 到 `WechatPayDialog`

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/hooks/useWechatOpenId.ts` | 新建：预加载微信 openId |
| `src/components/UnifiedPayDialog.tsx` | 透传 openId prop |
| `src/components/store/HealthStoreGrid.tsx` | 使用 hook + 传 openId + 状态恢复 |
| `src/pages/ZhileProductsPage.tsx` | 使用 hook + 传 openId |

