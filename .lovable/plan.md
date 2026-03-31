

# 修复 /my-page 联系客服问题

## 问题分析

1. **为什么不一样**：`/my-page` 弹出的是简化版 `TextCustomerSupport` 组件（小弹窗），而教练空间等入口跳转到的是完整版 `/customer-support` 页面（有快速选项、结构化推荐卡片等）。

2. **为什么无法使用**：`TextCustomerSupport` 发送的请求格式是 `{ message, conversationHistory }`，但边缘函数期望的是 `{ messages, sessionId }`。字段名不匹配导致后端报 500 错误。

## 修复方案：统一跳转到 /customer-support

最简单且体验一致的方案：`/my-page` 点击"联系客服"时直接跳转到 `/customer-support` 页面，而不是弹出简化版弹窗。

### `src/pages/MyPage.tsx`

- 将 `case "联系客服"` 的处理从 `setShowCustomerSupport(true)` 改为 `navigate("/customer-support")`
- 移除 `showCustomerSupport` state 和底部客服弹层代码
- 移除 `TextCustomerSupport` 的 import

这样所有入口（/my-page、教练空间等）统一使用功能完整的客服页面，避免两套实现不一致的问题。

