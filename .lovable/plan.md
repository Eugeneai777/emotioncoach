

## 体验包管理页面

在管理后台新增"体验包管理"页面，支持对 `partner_experience_items` 表进行增删改查操作，无需通过 Cloud 数据库视图手动操作。

---

### 功能概览

- 以表格形式展示所有体验包项目（名称、图标、关联套餐、颜色主题、排序、启用状态等）
- 支持新增、编辑、删除体验包项目
- 支持切换启用/禁用状态
- 支持调整显示排序
- 实时预览图标和颜色主题效果

---

### 实现步骤

#### 1. 新建管理组件

**文件：** `src/components/admin/ExperiencePackageManagement.tsx`

参照 `EnergyStudioToolsManagement.tsx` 的结构模式：
- 使用 React Query 查询 `partner_experience_items` 表全部记录
- 表格列：图标、名称、关联套餐(package_key)、价值(value)、颜色主题、排序、启用状态、操作
- 新增/编辑弹窗：包含所有可编辑字段（item_key、package_key、name、value、icon、description、features、color_theme、display_order、is_active）
- features 字段支持动态添加/删除多行输入
- color_theme 使用下拉选择（blue/green/amber/purple）
- 删除操作使用确认弹窗

#### 2. 注册路由

**文件：** `src/components/admin/AdminLayout.tsx`

- 导入 `ExperiencePackageManagement` 组件
- 添加路由：`<Route path="experience-items" element={<ExperiencePackageManagement />} />`

#### 3. 添加侧边栏入口

**文件：** `src/components/admin/AdminSidebar.tsx`

- 在"系统配置"分组中添加菜单项：
  - key: `experience-items`
  - label: `体验包管理`
  - path: `/admin/experience-items`
  - icon: `Gift`（从 lucide-react 导入）

---

### 技术细节

| 项目 | 说明 |
|------|------|
| 数据查询 | `supabase.from('partner_experience_items').select('*').order('display_order')` |
| 新增 | `supabase.from('partner_experience_items').insert(...)` |
| 编辑 | `supabase.from('partner_experience_items').update(...).eq('id', id)` |
| 删除 | `supabase.from('partner_experience_items').delete().eq('id', id)` |
| 缓存刷新 | 操作成功后 invalidate `experience-package-items` 和 `admin-experience-items` 两个 query key |
| 类型安全 | 使用 `Database["public"]["Tables"]["partner_experience_items"]` 类型 |

### 文件变更总表

| 文件 | 操作 |
|------|------|
| `src/components/admin/ExperiencePackageManagement.tsx` | 新建 |
| `src/components/admin/AdminLayout.tsx` | 修改 - 添加路由 |
| `src/components/admin/AdminSidebar.tsx` | 修改 - 添加侧边栏入口 |

