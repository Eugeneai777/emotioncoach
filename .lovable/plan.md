

# 管理后台新增"行业合作伙伴"入口

## 目标

在管理后台侧边栏"用户与订单"分组中，"有劲合伙人"下方新增"行业合作伙伴"菜单项，链接到一个新的管理页面，用于查看和管理所有行业合作伙伴的飞轮数据、Campaign 和产品包。

## 实施内容

### 1. 新建管理页面组件

新建 `src/components/admin/IndustryPartnerManagement.tsx`，内容包括：
- **合作伙伴列表**：从 partners 表读取所有合作伙伴，展示名称、推荐用户数、Campaign 数、产品包数
- **点击进入详情**：选中某个合作伙伴后，展示该合伙伙伴的：
  - 飞轮统计卡片（曝光、测评完成、成交、ROI）
  - Campaign 列表（筛选 partner_id）
  - 产品包列表（筛选 partner_id）
- 复用已有的 `PartnerFlywheel` 组件逻辑

### 2. 侧边栏新增菜单项

在 `AdminSidebar.tsx` 的"用户与订单"分组中，"有劲合伙人"下方添加：

| 菜单项 | 路径 | 图标 |
|--------|------|------|
| 行业合作伙伴 | /admin/industry-partners | Network |

### 3. 路由注册

在 `AdminLayout.tsx` 中新增路由：
```text
<Route path="industry-partners" element={<IndustryPartnerManagement />} />
```

### 技术细节

- 页面使用 AdminPageLayout 共享组件保持布局一致
- 合作伙伴列表使用表格展示，支持搜索筛选
- 选中合伙伙伴后以内嵌面板展示其飞轮数据，直接复用 PartnerFlywheel 组件（传入对应 partnerId）
- 管理员可在此页面总览所有行业合伙伙伴的数据表现

### 修改文件清单

1. **新建** `src/components/admin/IndustryPartnerManagement.tsx`
2. **修改** `src/components/admin/AdminSidebar.tsx` — 添加菜单项
3. **修改** `src/components/admin/AdminLayout.tsx` — 添加路由

