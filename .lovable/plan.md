
# 管理后台侧边栏 Logo 统一

## 当前状态

管理后台侧边栏顶部（`AdminSidebar.tsx` 第 212-224 行）使用的是一个紫色方块 + `LayoutDashboard` 图标，与全站其他页面使用的有劲AI圆形Logo不一致。

## 改动方案

仅修改 **1 个文件**：`src/components/admin/AdminSidebar.tsx`

### 具体改动

在 `SidebarHeader` 区域（第 212-224 行），将现有的紫色方块图标替换为 `BrandLogo` 组件：

1. 导入 `BrandLogo` 组件
2. 将 `<div className="flex h-9 w-9 ..."><LayoutDashboard /></div>` 替换为 `<BrandLogo size="sm" />`
3. Logo 可点击跳转首页，与 `PageHeader` 行为一致
4. 侧边栏折叠时仅显示 Logo，展开时显示 Logo + "管理后台" 文字

替换后的 SidebarHeader 结构：

```text
SidebarHeader
  Link to="/"
    BrandLogo size="sm"    （替代原来的紫色方块图标）
  "管理后台"               （保留原有文字）
  "有劲生活"               （保留原有副标题）
```

## 效果

- 管理后台左上角 Logo 与全站 PageHeader 中的有劲AI Logo 完全一致
- 点击 Logo 可返回首页
- 侧边栏折叠/展开状态均正常显示
