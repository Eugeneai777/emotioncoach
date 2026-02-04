

# 修复微信扫码绑定后白屏问题

## 问题诊断

### 根本原因

经过代码分析，发现白屏问题由 **Edge Function 中的条件判断错误** 导致：

**位置**：`supabase/functions/wechat-oauth-process/index.ts` 第 269-275 行

```typescript
// 对于绑定流程，直接返回成功
if (state === 'bind') {  // ❌ 永远不匹配！state 实际是 'bind_用户ID'
  return new Response(...)
}
```

**问题**：
- 实际传入的 state 格式是 `bind_{userId}`（如 `bind_13807a48-2b04-4c09-8fa0-1eb678cc58ce`）
- 条件 `state === 'bind'` 永远为 false
- 绑定流程不会在这里返回，而是继续执行 magic link 生成逻辑

### 导致的问题链

```text
1. 用户在 PC 端点击"绑定微信"
2. 生成二维码（指向设置页面）
3. 用户用微信扫码 → 在微信浏览器中打开设置页面
4. 用户点击"绑定微信账号" → 跳转到微信授权
5. 授权成功后跳转到 /wechat-oauth-callback
6. Edge Function 处理绑定：
   ✅ 保存映射成功
   ❌ 错误地生成 magic link（本不该生成）
7. 前端收到 { success: true, magicLink: true, tokenHash: ... }
8. 前端尝试 verifyOtp 登录（第 59-68 行）
   → 但此时微信浏览器内可能有另一个 session
   → 或 tokenHash 与当前用户不匹配
   → 导致错误或白屏
```

---

## 修复方案

### 修改 1：修复 Edge Function 条件判断

**文件**：`supabase/functions/wechat-oauth-process/index.ts`

**位置**：第 269-275 行

**改动前**：
```typescript
// 对于绑定流程，直接返回成功
if (state === 'bind') {
  return new Response(
    JSON.stringify({ success: true, isNewUser: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**改动后**：
```typescript
// 对于绑定流程，直接返回成功（不生成 magic link）
if (isBind) {
  return new Response(
    JSON.stringify({ success: true, isNewUser: false, bindSuccess: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### 修改 2：增强前端错误处理

**文件**：`src/pages/WeChatOAuthCallback.tsx`

添加兜底处理，防止未知响应导致白屏：

**位置**：第 99 行之后

**添加**：
```typescript
// 兜底处理：如果没有匹配任何已知情况，也导航到设置页
if (isBind) {
  console.warn('Unexpected bind response:', data);
  navigate("/settings?tab=notifications");
  return;
}

// 对于其他未知情况，导航到首页
console.warn('Unknown OAuth response:', data);
navigate("/");
```

---

## 文件清单

| 操作 | 文件路径 | 改动说明 |
|------|----------|----------|
| 修改 | `supabase/functions/wechat-oauth-process/index.ts` | 修复绑定流程的返回条件 |
| 修改 | `src/pages/WeChatOAuthCallback.tsx` | 添加兜底错误处理 |

---

## 技术细节

### 条件判断修复

原代码使用 `state === 'bind'` 严格匹配，但实际 state 是 `bind_用户ID` 格式。需要使用已有的 `isBind` 变量（第 74 行已定义：`const isBind = state.startsWith('bind_')`）。

### 返回值增强

在绑定成功返回中添加 `bindSuccess: true` 字段，与前端期望的判断条件 `(data?.success || data?.bindSuccess)` 匹配。

---

## 预期效果

- 绑定流程不再错误地生成 magic link
- 绑定成功后正确返回到设置页面
- 即使出现未知响应，也不会显示白屏

