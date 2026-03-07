

## 需求分析

当前只有超级管理员（admin）才能通过"设置角色"对话框给用户分配 `partner_admin` 角色并绑定行业合伙人。用户希望让已有 `partner_admin` 角色的用户（如 5e5cdc49...）能够自主添加/移除团队成员，让这些成员也能看到和管理知乐合伙人的活动。

## 方案

### 1. 创建 Edge Function: `manage-partner-team`

由于 `partner_admin` 没有对 `user_roles` 和 `partner_admin_bindings` 的写入权限（RLS 限制），需要一个 Edge Function 使用 service_role 来完成操作。

功能：
- **添加成员**：通过手机号查找用户 → 为其添加 `partner_admin` 角色（如不存在）→ 插入 `partner_admin_bindings` 绑定到调用者管理的合伙人
- **移除成员**：删除该用户对应合伙人的 binding，如该用户无其他 binding 则同时移除 `partner_admin` 角色
- **列出成员**：查询当前合伙人绑定的所有 partner_admin 用户列表

安全校验：调用者必须是该 partner 的已绑定 partner_admin 或超级 admin。

### 2. 新增 UI 组件: `PartnerTeamManager`

在行业合伙人详情页添加"团队成员"Tab，显示当前绑定到该合伙人的所有运营人员，并提供添加/移除功能。

- 显示成员列表（昵称、手机号、添加时间）
- "添加成员"按钮 → 输入手机号搜索并添加
- "移除"按钮（不能移除自己）

### 3. 在详情页 Tabs 中添加入口

在 `IndustryPartnerManagement.tsx` 的合伙人详情 Tabs 中新增"团队成员"Tab，对 partner_admin 和 admin 都可见。

### 文件变更

| 文件 | 操作 |
|------|------|
| `supabase/functions/manage-partner-team/index.ts` | 新建 Edge Function |
| `src/components/admin/industry-partners/PartnerTeamManager.tsx` | 新建 UI 组件 |
| `src/components/admin/IndustryPartnerManagement.tsx` | 添加"团队成员"Tab |

