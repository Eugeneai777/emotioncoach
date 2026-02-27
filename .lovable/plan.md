
## 问题

`partner_admin`（行业合伙人管理员）角色目前使用的是与超级管理员完全相同的仪表板（`AdminDashboard`），显示了总用户数、订单、收入、成本预警等敏感数据，并且快速操作链接指向他们无权访问的页面。

## 方案

为 `partner_admin` 创建一个专属的精简仪表板，只展示与其管理的行业合伙人相关的数据。

### 具体改动

**1. 新建 `PartnerAdminDashboard` 组件**

创建 `src/components/admin/PartnerAdminDashboard.tsx`，内容包括：
- 统计卡片：管理的行业合伙人数量、活跃活动数等（从 `partner_admin_bindings` 和 `industry_partners` 表查询）
- 快速操作：仅保留"行业合伙人管理"入口
- 移除所有敏感数据（用户数、订单、收入、成本预警、举报等）

**2. 修改路由配置**

在 `AdminLayout.tsx` 中，将 `partner_admin` 的首页路由从 `AdminDashboard` 改为 `PartnerAdminDashboard`：

```text
// Before
<Route index element={<AdminDashboard />} />

// After
<Route index element={<PartnerAdminDashboard />} />
```

### 技术细节

- `PartnerAdminDashboard` 会查询当前用户在 `partner_admin_bindings` 中绑定的合伙人，统计相关数据
- 使用与现有仪表板相同的 `AdminPageLayout` 和 `AdminStatCard` 组件保持 UI 一致性
- 所有链接仅指向 `/admin/industry-partners`，确保不会导航到无权访问的页面
