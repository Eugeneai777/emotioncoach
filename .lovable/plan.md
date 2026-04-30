## 后台全局功能搜索（Command Palette）

### 目标
后台菜单层级深、功能多（用户/订单/合伙人/绽放/内容/飞轮/运营/安全/配置 9+ 大类，60+ 子项），用户找不到「测评管理」「数据洞察」等具体功能。增加一个**全局搜索**，输入关键词即刻定位并跳转到任意后台功能。

### 核心设计

**入口**：在后台顶部 header 居中放一个搜索按钮 `🔍 搜索功能...  ⌘K`（替代/补充现有 header 空白区），点击或按 `⌘K / Ctrl+K` 唤起命令面板。

**面板交互（基于现有 `cmdk` / `CommandDialog` 组件）**：
- 模糊匹配：标题、中英文关键词、路径
- 键盘 ↑↓ 选择，Enter 跳转，Esc 关闭
- 命中后自动 `navigate(path)` 并关闭面板
- 按一级分组展示（概览 / 用户与订单 / 合伙人 / 内容管理 / 转化飞轮 / 运营数据 / 系统安全 / 系统配置）

### 数据来源

新建 `src/components/admin/adminNavRegistry.ts`，从现有 `AdminSidebar.tsx` 的 `NAV_GROUPS` 抽取为单一注册表，**两边共用**避免漂移。每条记录扩展 `keywords` 字段补齐别名：

```ts
{ key: "assessments", label: "测评管理", path: "/admin/assessments", 
  group: "内容管理", icon: ClipboardList,
  keywords: ["测评","评估","男人有劲","男士活力","vitality","SCL90","亲子沟通","女性竞争力","家长应对","assessment"] },
{ key: "assessment-insights", label: "测评数据洞察", path: "/admin/assessments", 
  group: "内容管理", icon: BarChart3,
  keywords: ["数据洞察","测评数据","用户画像","参与人数","respondents","insights"] },
```

为所有 60+ 项补 keywords（覆盖：中文同义词、英文、典型业务词如"绽放/bloom"、"飞轮/flywheel"、"小红书/xhs"、"公众号"、"激活码"等）。

### 新增组件

`src/components/admin/AdminCommandPalette.tsx`
- 使用 shadcn `CommandDialog` + `CommandInput` + `CommandGroup` + `CommandItem`
- 监听全局 `keydown` (`Cmd/Ctrl+K`) 切换 open
- 选中后 `navigate(item.path)` + `setOpen(false)`
- 当输入命中具体测评名（如"男人有劲"）时，额外提供「→ 测评管理」「→ 男人有劲数据洞察」两条精确建议（基于 `useAllAssessments` 动态加载，可选二期）

### 集成点

修改 `src/components/admin/AdminLayout.tsx` header：
```tsx
<header>
  <SidebarTrigger />
  <button className="flex-1 max-w-md mx-auto h-9 rounded-md border bg-muted/40 
                     text-sm text-muted-foreground flex items-center gap-2 px-3 hover:bg-muted">
    <Search className="w-4 h-4" />
    搜索功能… 
    <kbd className="ml-auto text-xs">⌘K</kbd>
  </button>
  <AdminLayoutDebugToggle />
</header>
<AdminCommandPalette />
```

修改 `AdminSidebar.tsx` 改为 `import { NAV_GROUPS } from "./adminNavRegistry"`（保持现有 UI 不变，仅去重数据源）。

### 移动端
- 搜索按钮在移动端以图标按钮形式显示（隐藏占位文字与快捷键提示）
- `CommandDialog` 在小屏自动全屏，保持原生体验

### 不改动
- 路由、权限、RLS、其他业务逻辑
- 角色过滤复用现有 `roles` 字段：partner_admin / content_admin 仅看到自己有权限的命令

### 涉及文件
- 新增：`src/components/admin/adminNavRegistry.ts`
- 新增：`src/components/admin/AdminCommandPalette.tsx`
- 修改：`src/components/admin/AdminLayout.tsx`（header + 挂载面板）
- 修改：`src/components/admin/AdminSidebar.tsx`（改用共享注册表）
