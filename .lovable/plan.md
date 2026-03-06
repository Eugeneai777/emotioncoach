

## 问题分析

**根本原因**：`/pay-entry` 页面缺少微信授权回跳后的支付自动恢复逻辑。

完整流程如下：
1. 好友在微信中打开 `/pay-entry?partner=xxx`，点击"立即支付"
2. `WechatPayDialog` 打开，检测到微信浏览器但无 openId → 触发静默授权重定向
3. 授权回调到 `/pay-entry?payment_auth_callback=1&code=xxx&payment_redirect=...`
4. PayEntry 用 code 换取 openId，重定向回 `/pay-entry?partner=xxx&payment_resume=1&payment_openid=xxx`
5. **BUG**：PayEntry 不识别 `payment_resume` 参数，页面只显示静态的"立即支付"按钮，支付对话框不会自动打开

用户被迫再次点击按钮，体验中断。且 URL 中的 `payment_openid` 可能在对话框打开前被清理，导致 JSAPI 支付失败。

## 修复方案

仅修改 `src/pages/PayEntry.tsx`，增加 `payment_resume` 自动恢复逻辑：

1. **检测 `payment_resume=1` 参数**：页面加载时，如果 URL 包含 `payment_resume=1`，在 partner 数据加载完成后自动设置 `showPayDialog = true`。

2. **提取 `payment_openid` 传递给支付组件**：从 URL 读取 `payment_openid`，作为 `openId` prop 传递给 `UnifiedPayDialog`（进而传给 `WechatPayDialog`），确保 JSAPI 支付可以直接调起。

3. **清理 URL 参数**：恢复后立即清理 `payment_resume`、`payment_openid`、`assessment_pay_resume` 等参数，防止刷新后重复触发。

| 类型 | 文件 | 说明 |
|------|------|------|
| 改 | `src/pages/PayEntry.tsx` | 增加 payment_resume 自动恢复逻辑 |

