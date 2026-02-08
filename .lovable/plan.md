

## 修复小程序支付后长时间等待的问题

### 问题根因

支付完成后，前端轮询 `check-order-status` 时只传了 `{ orderNo }`，**没有传 `forceWechatQuery: true`**。

这导致后端只查数据库，而数据库的状态更新依赖微信的异步回调（webhook）。微信回调有延迟（通常 2-15 秒，偶尔更久），所以用户会看到"等待支付完成"很长时间。

```text
当前流程：
  用户完成支付 → 前端轮询（每3秒） → 只查数据库 → 状态仍为 pending
  ← 等等等...
  微信回调到达（延迟不确定） → 更新数据库 → 下一次轮询 → 终于显示成功

优化后：
  用户完成支付 → 前端轮询（每3秒） → 前几次查数据库
  → 第3次开始加 forceWechatQuery → 主动问微信"这个订单付了没？"
  → 微信说"付了" → 立即更新数据库并返回成功
```

### 修复方案

#### 1. 轮询函数增加主动查询微信

**文件：** `src/components/WechatPayDialog.tsx`

修改 `startPolling` 函数，增加轮询计数器：
- 前 2 次（0-6秒）：只查数据库（给 webhook 时间到达）
- 第 3 次起（6秒+）：携带 `forceWechatQuery: true`，主动查询微信

```typescript
let pollCount = 0;
pollingRef.current = setInterval(async () => {
  pollCount++;
  const shouldForceQuery = pollCount >= 3; // 6秒后开始主动查询

  const { data, error } = await supabase.functions.invoke('check-order-status', {
    body: { orderNo, forceWechatQuery: shouldForceQuery },
  });
  // ...
}, 3000);
```

#### 2. 小程序回前台时主动查询

**文件：** `src/components/WechatPayDialog.tsx`

修改 `maybeResumeCheck` 函数（约第 1003 行），在用户从小程序原生支付页返回时，立即传 `forceWechatQuery: true`。因为此时用户大概率刚完成支付，主动查询能立刻确认。

```typescript
const { data, error } = await supabase.functions.invoke('check-order-status', {
  body: { orderNo: pendingOrderNo, forceWechatQuery: true },
});
```

#### 3. 支付回调场景也主动查询

**文件：** `src/components/WechatPayDialog.tsx`

修改 `verifyOrder` 函数（约第 1077 行），支付回调 URL 参数场景也传 `forceWechatQuery: true`。

---

### 技术细节

| 位置 | 改动 |
|------|------|
| `startPolling` 函数（第 926-996 行） | 增加 `pollCount` 计数器，第 3 次起传 `forceWechatQuery: true` |
| `maybeResumeCheck` 函数（第 1021 行） | 调用时传 `forceWechatQuery: true` |
| `verifyOrder` 函数（第 1079 行） | 调用时传 `forceWechatQuery: true` |

### 预期效果

- 支付完成后 6-9 秒内即可确认成功（之前可能需要 10-30+ 秒）
- 小程序返回前台时几乎立即确认（1-2 秒）
- 前 6 秒仍优先依赖 webhook（避免频繁调用微信 API）

### 文件变更总表

| 文件 | 操作 |
|------|------|
| `src/components/WechatPayDialog.tsx` | 修改 - 轮询和回调验证时传入 forceWechatQuery |

