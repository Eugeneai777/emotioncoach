

# 管理后台整体设计与排版优化

## 当前问题分析

通过审查代码，发现管理后台存在以下设计与排版问题：

1. **页面结构不统一**：部分页面有标题区域，部分没有；有的用 Card 包裹，有的直接用 div
2. **表格不可横向滚动**：多个页面的表格缺少 `overflow-x-auto` 和 `min-w` 设置，导致窄屏下内容被压缩
3. **筛选区风格不统一**：搜索框、下拉筛选的高度、间距各页面不同
4. **统计卡片风格各异**：AdminDashboard、ContentAdminDashboard、CommunityPostsManagement 各自定义了不同风格的 StatCard
5. **间距与排版不一致**：有的页面用 `space-y-6`，有的用 `space-y-4`，padding 不统一

---

## 优化方案

### 1. 创建统一的管理页面布局组件

**新文件**: `src/components/admin/shared/AdminPageLayout.tsx`

提供统一的页面标题区域（标题 + 描述 + 右侧操作按钮）和内容区域包裹，确保所有管理页面有一致的上下间距和排版。

### 2. 创建统一的统计卡片组件

**新文件**: `src/components/admin/shared/AdminStatCard.tsx`

统一 StatCard 的视觉样式：左侧带颜色图标区 + 右侧数值/标签，所有仪表板页面共用。替代当前 AdminDashboard、ContentAdminDashboard、CommunityPostsManagement 中各自内联定义的 StatCard。

### 3. 创建统一的筛选栏组件

**新文件**: `src/components/admin/shared/AdminFilterBar.tsx`

统一搜索框 + 筛选下拉的布局样式（高度 h-9、间距 gap-2、响应式换行），提供 slot 模式供各页面放入自定义筛选器。

### 4. 创建统一的数据表格容器

**新文件**: `src/components/admin/shared/AdminTableContainer.tsx`

包含 `border rounded-lg overflow-hidden` 外层 + `overflow-x-auto` 内层 + 可配置的 `min-w`，确保所有表格页面都能横向滚动。

### 5. 逐页应用统一组件

对以下页面进行改造（引入上述共享组件）：

- **CommunityPostsManagement.tsx** - 使用 AdminPageLayout + AdminStatCard + AdminFilterBar + AdminTableContainer
- **ContentAdminDashboard.tsx** - 使用 AdminPageLayout + AdminStatCard
- **AdminDashboard.tsx** - 使用 AdminPageLayout + AdminStatCard
- **UserAccountsTable.tsx** - 使用 AdminPageLayout + AdminFilterBar + AdminTableContainer
- **OrdersTable.tsx** - 使用 AdminPageLayout + AdminFilterBar + AdminTableContainer
- **PartnerManagement.tsx** - 使用 AdminPageLayout + AdminFilterBar + AdminTableContainer
- **VideoCoursesManagement.tsx** - 使用 AdminPageLayout + AdminTableContainer
- **KnowledgeBaseManagement.tsx** - 使用 AdminPageLayout
- **CoachTemplatesManagement.tsx** - 使用 AdminPageLayout
- **PackagesManagement.tsx** - 使用 AdminPageLayout + AdminTableContainer
- **ReportsManagement.tsx** - 使用 AdminPageLayout + AdminTableContainer
- **ActivationCodeManagement.tsx** - 使用 AdminPageLayout + AdminFilterBar + AdminTableContainer

### 6. AdminLayout 主框架微调

- 确保 `main` 区域使用 `overflow-auto` 支持双向滚动
- 统一内容区 padding 为 `p-6`

---

## 技术细节

### AdminPageLayout 结构

```text
+--------------------------------------------------+
| 标题                              [操作按钮区域]  |
| 描述文字                                          |
+--------------------------------------------------+
| {children}                                        |
+--------------------------------------------------+
```

Props: `title`, `description`, `actions` (ReactNode), `children`

### AdminStatCard 统一风格

```text
+--[图标]--+--数值标签--+
|  彩色底   |  123       |
|  图标     |  标题      |
+-----------+------------+
```

Props: `label`, `value`, `icon`, `accent?`, `loading?`, `href?`, `subtitle?`

### AdminFilterBar 结构

```text
[搜索框..............] [筛选1 v] [筛选2 v]  共 N 条
```

Props: `searchValue`, `onSearchChange`, `searchPlaceholder`, `children` (筛选器 slot), `totalCount?`

### AdminTableContainer

```text
<div className="border rounded-lg overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-sm" style={{ minWidth }}>
      ...
    </table>
  </div>
</div>
```

Props: `minWidth?` (默认 800px), `children`

### 改造优先级

1. 先创建 4 个共享组件
2. 改造 CommunityPostsManagement（当前页面）
3. 改造两个 Dashboard
4. 逐步改造其余表格页面

所有改造保持功能和数据逻辑不变，仅替换布局容器和视觉组件。

