

# 支持国外手机号注册

## 问题

当前批量注册逻辑将所有手机号统一加 `+86` 前缀，导致像 `610-909-8999`（美国号码）这样的海外手机号无法正确注册。

## 方案

### 1. 修改手动添加邀请表单

在 `BloomPartnerInvitations.tsx` 的手动添加对话框中新增"区号"下拉选择：
- 默认 `+86`（中国）
- 可选 `+1`（美国/加拿大）、`+852`（香港）、`+886`（台湾）、`+65`（新加坡）等常用区号
- 区号存入 `partner_invitations` 表的新字段 `invitee_phone_country_code`

### 2. 数据库新增字段

在 `partner_invitations` 表添加：

```text
invitee_phone_country_code TEXT DEFAULT '+86'
```

### 3. 修改批量导入 CSV

`BloomPartnerBatchImport` 组件支持第三列可选区号：
- CSV 格式变为：`姓名,手机号,区号（可选）`
- 未填区号时默认 `+86`

### 4. 修改 Edge Function `batch-register-bloom-partners`

- 从邀请记录读取 `invitee_phone_country_code`（默认 `+86`）
- 注册时使用正确区号：`auth.admin.createUser({ phone: countryCode + digits })`
- 写入 profiles 时同步正确的 `phone_country_code`
- 手机号标准化逻辑调整：国内号码取后 11 位，国外号码保留完整数字

### 5. 修改 `auto-claim-bloom-invitation` 函数

匹配逻辑需考虑区号，避免跨国号码误匹配。

## 修改文件清单

| 文件 | 操作 | 内容 |
|------|------|------|
| 数据库迁移 | 新增 | `partner_invitations` 表添加 `invitee_phone_country_code` 字段 |
| `src/components/admin/BloomPartnerInvitations.tsx` | 修改 | 手动添加表单增加区号选择 |
| `src/components/admin/BloomPartnerBatchImport.tsx` | 修改 | CSV 支持第三列区号 |
| `supabase/functions/batch-register-bloom-partners/index.ts` | 修改 | 使用邀请记录中的区号注册 |
| `supabase/functions/auto-claim-bloom-invitation/index.ts` | 修改 | 匹配时考虑区号 |

