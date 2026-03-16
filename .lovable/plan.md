

# 修复情绪健康测评微信支付闪现问题

## 根因
`AssessmentPayDialog` 的初始化 useEffect 缺少防重入保护（ref guard），导致 `openIdResolved` 状态变化时在 `status` 尚未切换前多次调用 `createOrder()`，3秒内创建5个订单。每个新订单取消前一个的 prepay_id，JSAPI 支付弹窗调起后立即失效 → 闪现消失。

## 修复方案

### 文件：`src/components/wealth-block/AssessmentPayDialog.tsx`

**变更1**：新增 `createOrderCalledRef`（类似 WechatPayDialog 的 `orderCreatedRef`）

在 state 声明区域添加：
```typescript
const createOrderCalledRef = useRef(false);
```

**变更2**：修改 L960 的初始化 useEffect，加入 ref guard

```typescript
useEffect(() => {
  if (shouldWaitForOpenId && !openIdResolved) return;
  if (open && status === "idle" && !createOrderCalledRef.current) {
    createOrderCalledRef.current = true;
    createOrder();
  }
}, [open, status, shouldWaitForOpenId, openIdResolved]);
```

**变更3**：在关闭弹窗时重置 ref（L1028 附近）

```typescript
useEffect(() => {
  if (!open) {
    stopPolling();
    createOrderCalledRef.current = false; // 重置
    // ... 其他重置逻辑
  }
}, [open]);
```

**变更4**：在重试逻辑中重置 ref（如有手动重试按钮）

确保用户点击"重试"时 `createOrderCalledRef.current = false` 再调用 `createOrder()`。

## 影响范围
仅修改 `src/components/wealth-block/AssessmentPayDialog.tsx`，添加 ref 防重入保护。不影响其他支付组件（WechatPayDialog 已有此保护）。

