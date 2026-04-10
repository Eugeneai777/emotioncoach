

# 诊断结果：余额不足时扣费失败未触发横幅

## 根本原因

当用户余额为 0 时，`deduct-quota` 边缘函数调用 `deduct_user_quota` RPC，RPC 抛出异常 `'Insufficient quota or user not found'`，导致边缘函数返回 **HTTP 400** 状态码。

**关键问题在前端判断逻辑：**

Supabase SDK 收到 HTTP 400 后，设置 `error` 为 `FunctionsHttpError`（而不是在 `data.error` 中）。前端代码（L479）将 `FunctionsHttpError` 归类为**网络错误**（`isNetworkError = true`）：

```typescript
// CoachVoiceChat.tsx L479
const isFunctionsHttpError = (error as any)?.name?.toLowerCase?.().includes('functionshttperror');
const isNetworkErr = ... || isFunctionsHttpError;  // ← HTTP 400 被当作网络错误
```

然后在 L540-543：
```typescript
if (!result.success && !result.isNetworkError) {
  setInsufficientDuringCall(true);  // ← 永远不会执行，因为 isNetworkError=true
}
```

所以余额不足的 HTTP 400 被误判为网络波动，重试 3 次后静默失败，横幅永远不会显示。

## 修复方案

**仅修改 `src/components/coach/CoachVoiceChat.tsx` 中的错误判断逻辑**，在 `FunctionsHttpError` 分支中进一步区分：HTTP 400 = 业务错误（余额不足），HTTP 5xx = 网络/服务端波动。

### 具体改动（约 15 行）

在 `deductQuotaWithRetry` 函数的 `if (error)` 分支（L474-496）中：

1. 当 `error` 是 `FunctionsHttpError` 时，从 `error.context`（Response 对象）读取 HTTP 状态码
2. 如果状态码是 **400**，尝试解析响应体获取业务错误信息（如"余额不足"），返回 `{ success: false, isNetworkError: false }`
3. 如果状态码是 **5xx**，保持现有逻辑视为可重试的网络错误

```typescript
// 修改后的判断逻辑（伪代码）
if (error) {
  // 新增：FunctionsHttpError 需要区分 4xx 和 5xx
  if (isFunctionsHttpError && error.context) {
    const status = error.context.status;
    if (status === 400) {
      // 业务错误（余额不足），不重试，直接返回
      return { success: false, isNetworkError: false };
    }
    // 5xx 继续走重试逻辑
  }
  // ... 保持原有网络错误重试逻辑不变
}
```

### 不涉及的改动
- 不修改 `deduct-quota` 边缘函数
- 不修改横幅 UI（已实现）
- 不修改 `deductQuota` 调用逻辑和 `setInsufficientDuringCall` 触发点
- 不影响训练营权益检查、退费等现有逻辑

