

# 侧边栏合伙人分组重构

## 目标

将"有劲合伙人"、"绽放合伙人"和"行业合作伙伴"统一归入一个新的"合伙人"分组，并将"行业合作伙伴"重命名为"行业合伙人"。

## 具体变更

### 修改 `src/components/admin/AdminSidebar.tsx`

**当前结构：**
- "用户与订单" 分组下包含：用户账户、订单管理、有劲合伙人、行业合作伙伴
- "绽放合伙人" 是独立分组，包含：绽放邀请管理、合伙人交付、单营交付等

**调整后结构：**

1. **"用户与订单"分组**：移除"有劲合伙人"和"行业合作伙伴"，只保留"用户账户"和"订单管理"

2. **新建"合伙人"分组**（位于"用户与订单"之后、"内容管理"之前），包含：
   - 有劲合伙人 → /admin/partners
   - 绽放邀请管理 → /admin/bloom-invitations
   - 合伙人交付 → /admin/bloom-delivery
   - 单营交付 → /admin/bloom-single
   - 绽放利润核算 → /admin/bloom-profit
   - 绽放月度利润 → /admin/bloom-monthly
   - 绽放月度现金流 → /admin/bloom-cashflow
   - 行业合伙人 → /admin/industry-partners（重命名）

3. **删除原"绽放合伙人"独立分组**

### 修改文件

仅需修改 `src/components/admin/AdminSidebar.tsx` 中的 `NAV_GROUPS` 数组配置。

