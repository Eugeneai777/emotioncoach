

# 行业合伙人运营人员方案（限定特定合伙人）

## 目标

新增 `partner_admin` 角色，运营人员登录后台后**仅能看到和操作自己被绑定的那一个（或几个）行业合伙人**，而非所有合伙人。

## 整体设计

```text
user_roles 表          partner_admin_bindings 表
+----------------+     +-------------------------+
| user_id        |     | user_id (运营人员)       |
| role =         |     | partner_id (绑定的合伙人) |
| partner_admin  |     +-------------------------+
+----------------+
        \                       /
         \                     /
          前端：过滤侧边栏 + 路由
          后端：查询时按 binding 过滤
```

## 实施步骤

### 1. 数据库变更

**a) 扩展 app_role 枚举**

```sql
ALTER TYPE public.app_role ADD VALUE 'partner_admin';
```

**b) 创建绑定表 `partner_admin_bindings`**

记录哪个运营人员可以管理哪个行业合伙人：

```sql
CREATE TABLE public.partner_admin_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

ALTER TABLE public.partner_admin_bindings ENABLE ROW LEVEL SECURITY;

-- 管理员可以管理所有绑定
CREATE POLICY "admin_manage_bindings" ON public.partner_admin_bindings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- partner_admin 只能查看自己的绑定
CREATE POLICY "partner_admin_view_own" ON public.partner_admin_bindings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

### 2. 前端：扩展 AdminRole 类型

在 `AdminLayout.tsx` 中扩展：
```text
export type AdminRole = 'admin' | 'content_admin' | 'partner_admin';
```

### 3. 入口鉴权（Admin.tsx）

- 角色检查增加 `partner_admin`，允许进入后台
- 优先级：admin > partner_admin > content_admin

### 4. 侧边栏（AdminSidebar.tsx）

`partner_admin` 仅可见以下菜单组：
- **概览**（仪表板）
- **合伙人** 中仅保留 **行业合伙人** 一项（隐藏有劲/绽放）

其他组（用户与订单、系统安全、成本监控、转化飞轮等）全部不可见。

### 5. 行业合伙人页面过滤（IndustryPartnerManagement.tsx）

核心变更 — `partner_admin` 看到的不是全部行业合伙人，而是仅自己绑定的：

- 页面加载时，先查询 `partner_admin_bindings` 获取当前用户绑定的 `partner_id` 列表
- `fetchPartners` 查询增加 `.in('id', boundPartnerIds)` 过滤
- 隐藏"新建行业合伙人"按钮（仅 admin 可见）
- 如果只绑定了一个合伙人，直接跳转到该合伙人的飞轮详情页

### 6. 路由控制（AdminLayout.tsx）

`partner_admin` 可访问的路由：
- `industry-partners`（行业合伙人管理，自动按绑定过滤）

不可访问的路由（保持仅 admin）：用户、订单、有劲/绽放合伙人、系统安全、成本监控等全部其他页面。

### 7. 角色分配（SetRoleDialog.tsx）

新增角色选项：
- 标签：**合伙人运营**
- 图标：Handshake（绿色）
- 描述：仅可管理被分配的行业合伙人

### 8. 合伙人绑定管理 UI

在 `SetRoleDialog.tsx` 或单独组件中，当勾选 `partner_admin` 角色时：
- 展示行业合伙人下拉选择器（多选）
- 保存时同步写入 `partner_admin_bindings` 表
- 管理员可随时修改绑定关系

### 9. 汉堡菜单入口（CoachHeader.tsx）

将 admin 角色检查从仅 `admin` 扩展为同时检查 `partner_admin`：

```text
检查 user_roles 是否包含 admin 或 partner_admin
```

## 涉及文件

| 文件 | 变更 |
|------|------|
| 数据库迁移 | 新增 `partner_admin` 枚举值 + `partner_admin_bindings` 表 + RLS |
| `src/components/admin/AdminLayout.tsx` | 扩展 AdminRole、增加 partner_admin 路由条件 |
| `src/components/admin/AdminSidebar.tsx` | partner_admin 仅显示概览 + 行业合伙人 |
| `src/pages/Admin.tsx` | 角色检查加入 partner_admin |
| `src/components/admin/IndustryPartnerManagement.tsx` | 按绑定过滤合伙人列表、隐藏新建按钮 |
| `src/components/admin/SetRoleDialog.tsx` | 新增角色选项 + 合伙人绑定选择器 |
| `src/components/coach/CoachHeader.tsx` | 后台入口兼容 partner_admin |

## 安全性

- 绑定表有独立 RLS，partner_admin 仅能读取自己的绑定记录
- 合伙人数据查询在前端按 binding 过滤，即使手动输入 URL 访问其他合伙人 ID，因 binding 不存在也无法操作
- 不影响现有 admin 和 content_admin 的权限体系

