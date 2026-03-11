

# 增加支付宝支付选项

## 现状

当前 `UnifiedPayDialog` 的路由逻辑是**自动判断、不可选择**：
- 移动端非微信浏览器 → 支付宝 H5（自动）
- 微信浏览器 → 微信 JSAPI
- 桌面端 → 微信扫码

用户在微信浏览器或桌面端**无法选择支付宝**。

## 方案

在 `UnifiedPayDialog` 中增加支付方式选择器，让用户可以在微信支付和支付宝之间切换：

### 1. 改造 `UnifiedPayDialog.tsx`

- 新增内部 state `payMethod: 'wechat' | 'alipay'`
- 默认值按原有逻辑自动设定（移动端非微信默认支付宝，其余默认微信）
- 在弹窗顶部渲染两个支付方式 Tab（微信支付 / 支付宝），用户可点击切换
- 根据 `payMethod` 渲染对应的 `WechatPayDialog` 或 `AlipayPayDialog`
- 微信小程序环境下**不显示**支付宝选项（小程序只能用微信支付）

```text
┌─────────────────────────┐
│   ┌──────┐ ┌──────┐     │
│   │微信  │ │支付宝│     │  ← 支付方式选择 Tab
│   └──────┘ └──────┘     │
│                         │
│  [对应支付组件内容]      │
│                         │
└─────────────────────────┘
```

### 2. 改造思路

不再由 `UnifiedPayDialog` 直接渲染 `WechatPayDialog` / `AlipayPayDialog` 的完整 `<Dialog>`，而是：
- `UnifiedPayDialog` 自己持有唯一的 `<Dialog>` 外壳
- 内部根据 `payMethod` 渲染对应支付组件的**内容部分**
- 或者更简单的方案：保持现有架构，只是让用户切换时关闭当前 Dialog 再打开另一个

**采用简单方案**：`UnifiedPayDialog` 维护 `payMethod` state，直接条件渲染两个 Dialog 组件，切换时 reset 对方状态。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/UnifiedPayDialog.tsx` | 增加支付方式选择 + 条件渲染 |

