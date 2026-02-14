

# 批量注册绽放合伙人账号（手机号直接注册 + 财富教练为主页）

## 概述

用手机号直接创建账号（不生成占位邮箱），密码统一 `123456`，登录后自动跳转到财富教练打卡页面。

## 变更点

### 1. 新建 Edge Function: `supabase/functions/batch-register-bloom-partners/index.ts`

**核心逻辑**：

```text
1. 查询所有 status='pending' 的 bloom 邀请
2. 对每条邀请：
   a. 提取手机号，标准化为纯数字
   b. 调用 auth.admin.createUser({ phone: '+86' + digits, password: '123456', phone_confirm: true })
      - 不使用邮箱，直接用手机号注册
   c. 更新 profiles 表：display_name, phone, phone_country_code, auth_provider='phone', preferred_coach='wealth'
      - preferred_coach='wealth' 确保登录后自动跳转财富教练页面
   d. 创建 partners 记录（bloom 类型，L0 级别）
   e. 创建 bloom_partner_orders 记录
   f. 创建 orders 记录（财富卡点测评，0元已付）
   g. 创建 user_camp_purchases 记录（7天财富训练营）
   h. 更新邀请状态为 claimed
3. 已存在手机号的用户跳过创建，仍尝试发放未发放的权益
4. 返回统计：{ success, skipped, failed, details }
```

**登录后跳转逻辑**（已有，无需修改）：

现有 `Auth.tsx` 中已实现：当 `profiles.preferred_coach = 'wealth'` 且有活跃训练营时，登录后自动跳转到 `/wealth-camp-checkin`。Edge Function 设置 `preferred_coach: 'wealth'` 即可。

**用户登录方式**：

用户使用手机号 + 密码 `123456` 在现有登录页面（手机号模式）登录即可，无需任何登录页修改。

### 2. 修改 `src/components/admin/BloomPartnerInvitations.tsx`

在标题栏旁新增"一键注册并发放权益"按钮：
- 仅当有 pending 邀请时启用
- 点击弹出 AlertDialog 确认（显示待处理数量）
- 确认后调用 edge function，按钮显示加载状态
- 完成后 toast 显示结果统计，自动刷新列表

## 修改文件清单

| 文件 | 操作 | 内容 |
|------|------|------|
| `supabase/functions/batch-register-bloom-partners/index.ts` | 新建 | 批量手机号注册 + 权益发放 |
| `src/components/admin/BloomPartnerInvitations.tsx` | 修改 | 添加"一键注册"按钮 + 确认对话框 |

