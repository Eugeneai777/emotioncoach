

# 批量注册简化 - 只建账号，邀请码保持 pending

## 问题

当前 `batch-register-bloom-partners` 在批量注册时同时完成了权益发放和邀请码标记为 `claimed`，导致用户无法再通过输入邀请码来兑换。

## 改动

**文件：`supabase/functions/batch-register-bloom-partners/index.ts`**

删除第 168-282 行的以下逻辑：
- 创建/升级合伙人记录（partners 表）
- 创建 bloom_partner_orders 记录
- 发放财富测评订单（orders 表）
- 发放 7 天训练营（user_camp_purchases 表）
- 将邀请状态改为 `claimed`

保留第 82-166 行的核心逻辑：
- 创建用户账号（密码 123456）
- 更新 profiles（姓名、手机号、must_change_password）

### 技术细节

将第 168-285 行替换为：

```typescript
        results.push({ name, phone: rawPhone, status: 'success' });
        console.log(`Batch registered account: ${name} (${phone}), invitation stays pending for user to claim`);
```

### 流程变化

```text
改动前：批量注册 → 建账号 + 发权益 + 标记claimed → 用户输入邀请码 → 失败
改动后：批量注册 → 只建账号（邀请码 pending） → 用户输入邀请码 → 兑换成功
```

用户通过 `claim-partner-invitation` 函数兑换时，会自动完成合伙人身份、财富测评、训练营的全部权益发放。

