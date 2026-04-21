

## 修复微信支付弹窗关闭后重复发起支付

### 问题
点击右上角 X 关闭 `WechatPayDialog` 时，`resetState()` 把 `orderCreatedRef.current` 设回 `false`，但 `open` prop 还没异步更新到 `false`，触发订单创建的 `useEffect` 立即重跑 → 又创建一笔订单 + 弹起微信 JSAPI 支付层 → 弹窗关不掉。

### 修复方案（仅改一处，最小改动）

**文件**：`src/components/WechatPayDialog.tsx`

**改动**：
1. 从 `resetState()` 中**移除** `orderCreatedRef.current = false` 这一行
2. 新增一个独立 `useEffect`，仅在 `open` 从 `false` → `true` 的"打开边沿"时把 `orderCreatedRef.current` 重置为 `false`（用一个 `prevOpenRef` 记录上一次的 open 值）

```ts
const prevOpenRef = useRef(false);
useEffect(() => {
  if (open && !prevOpenRef.current) {
    // 仅在"打开"瞬间重置
    orderCreatedRef.current = false;
  }
  prevOpenRef.current = open;
}, [open]);
```

### 不影响的业务逻辑（明确保留）
- 支付方式自动路由（UnifiedPayDialog）逻辑不动
- 微信小程序 H5 支付恢复逻辑不动
- ETIMEDOUT 重试逻辑不动
- 订单创建的 edge function、回调、自愈链路不动
- `resetState()` 其余字段（step、agreedTerms、qrCode 等）的清理逻辑保留

### 验证步骤
1. 微信浏览器内进入付费课程 → 打开支付弹窗 → 点右上角 X → 弹窗应立即消失，不再触发新订单
2. 正常完成一次支付 → 关闭 → 再次打开 → 仍能正常创建新订单（验证打开边沿重置生效）
3. 检查 `create-wechat-order` 函数日志，关闭后不应再出现新调用

