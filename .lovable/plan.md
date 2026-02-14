

# 修复绽放邀请码兑换页面错误

## 问题根因

通过调试发现，点击"立即成为绽放合伙人"按钮后，`claim-partner-invitation` 返回 **400 错误**，具体错误信息为：

**"您已是其他类型的合伙人"**

当前登录用户已经是 **有劲合伙人（youjin partner）**，而 `claim-partner-invitation` 函数中的逻辑不允许已有其他类型合伙人身份的用户再领取绽放邀请。

此外，前端代码没有正确提取和显示后端返回的具体错误信息，而是显示了通用的"领取失败，请稍后重试"。

## 需要修复的两个问题

### 问题 1：前端未正确显示错误信息

`PartnerInvitePage.tsx` 中的 `handleClaim` 函数在 `supabase.functions.invoke` 返回非 2xx 状态时，错误信息被放入 `error` 对象中。当前代码直接 `throw error`，在 catch 中显示通用信息，没有提取后端返回的具体错误文案。

**修复方案**：从 `FunctionsHttpError` 中提取 response body，显示后端返回的具体错误信息。

### 问题 2：已有其他类型合伙人无法领取绽放邀请

当前 `claim-partner-invitation` 函数在发现用户已是非 bloom 类型合伙人时直接拒绝。但业务上，有劲合伙人转为绽放合伙人应该是被允许的（绽放是更高级别的合伙类型）。

**修复方案**：修改 `claim-partner-invitation` 中的逻辑，当用户已是 youjin 合伙人时，将其升级为 bloom 合伙人（更新 partner_type），而不是直接拒绝。同时在 `auto-claim-bloom-invitation` 中做相同修改。

---

## 技术细节

### 1. PartnerInvitePage.tsx - 改进错误处理

修改 `handleClaim` 函数的 catch 块，从 `FunctionsHttpError` 中读取具体错误信息：

```typescript
} catch (err: any) {
  console.error('Claim error:', err);
  // 尝试从 FunctionsHttpError 提取后端错误信息
  let errorMessage = "领取失败，请稍后重试";
  if (err?.context?.body) {
    try {
      const body = typeof err.context.body === 'string' 
        ? JSON.parse(err.context.body) 
        : err.context.body;
      if (body?.error) errorMessage = body.error;
    } catch {}
  } else if (err?.message) {
    errorMessage = err.message;
  }
  toast.error(errorMessage);
}
```

### 2. claim-partner-invitation/index.ts - 支持合伙人类型升级

将"您已是其他类型的合伙人"拒绝逻辑改为升级逻辑：

```typescript
if (existingPartner) {
  if (existingPartner.partner_type === 'bloom') {
    return Response(JSON.stringify({ success: true, message: '您已经是绽放合伙人', already_partner: true }));
  }
  // 升级：将 youjin 合伙人升级为 bloom
  await adminClient
    .from('partners')
    .update({
      partner_type: 'bloom',
      partner_level: 'L0',
      commission_rate_l1: 0.30,
      commission_rate_l2: 0.10,
      source: 'manual',
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingPartner.id);
  // 继续执行后续的权益发放逻辑（bloom_partner_orders、orders、user_camp_purchases）
}
```

### 3. auto-claim-bloom-invitation/index.ts - 同步修改

与 claim-partner-invitation 保持一致的升级逻辑，确保自动匹配时也支持合伙人类型升级。

### 修改文件清单

| 文件 | 改动内容 |
|------|----------|
| `src/pages/PartnerInvitePage.tsx` | 改进错误处理，显示后端具体错误信息 |
| `supabase/functions/claim-partner-invitation/index.ts` | 支持 youjin 到 bloom 的合伙人升级 |
| `supabase/functions/auto-claim-bloom-invitation/index.ts` | 同步支持合伙人类型升级 |

