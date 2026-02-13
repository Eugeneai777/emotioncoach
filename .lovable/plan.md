

# 新增"内容管理员"角色并授权张艳

## 概述
创建一个权限受限的"内容管理员"角色，仅允许访问内容管理相关功能（社区动态、举报管理等），不能查看仪表板、用户账户、订单、财务等页面。

---

## 改动范围

### 1. 数据库变更

- 在 `app_role` 枚举中添加 `content_admin` 值
- 为张艳分配角色：`user_id = 'e8e9081d-...'`, `role = 'content_admin'`
- 在 `community_posts` 表上为 `content_admin` 添加 SELECT / UPDATE / DELETE 策略

### 2. 前端代码变更

**`src/pages/Admin.tsx`**
- 权限检查：允许 `admin` 或 `content_admin` 角色进入后台
- 将用户角色传递给 `AdminLayout`

**`src/components/admin/AdminLayout.tsx`**
- 接收用户角色，根据角色过滤路由
- `content_admin` 仅可访问内容管理和举报管理相关路由
- `content_admin` 的默认首页改为 `/admin/community-posts`（而非仪表板）

**`src/components/admin/AdminSidebar.tsx`**
- 接收用户角色，按角色过滤侧边栏分组
- `content_admin` 仅显示：
  - 内容管理（教练模板、真人教练、训练营、视频课程、知识库、生活馆工具、社区动态）
  - 举报管理
- 隐藏：概览仪表板、用户与订单、绽放合伙人、运营数据（除举报）、系统安全、系统配置

---

## 权限矩阵

```text
功能区域           | admin | content_admin
-------------------|-------|-------------
概览仪表板         |  Yes  |  No
用户账户/订单      |  Yes  |  No
合伙人管理         |  Yes  |  No
内容管理（全部）   |  Yes  |  Yes
举报管理           |  Yes  |  Yes
运营数据（其他）   |  Yes  |  No
系统安全           |  Yes  |  No
系统配置           |  Yes  |  No
```

---

## 技术细节

- 数据库：`ALTER TYPE app_role ADD VALUE 'content_admin'`
- `Admin.tsx`：查询改为 `.in('role', ['admin', 'content_admin'])`，记录具体角色并传给 `AdminLayout`
- `AdminLayout`：`content_admin` 角色访问 `/admin` 时重定向到 `/admin/community-posts`，仅注册白名单路由
- `AdminSidebar`：每个导航分组增加 `roles` 字段标注允许访问的角色列表，侧边栏根据当前角色过滤显示
- `community_posts` RLS：添加 `has_role(auth.uid(), 'content_admin')` 策略
- 张艳 user_id：`e8e9081d-51d6-4506-a0a6-8b2f6bcf7093`

