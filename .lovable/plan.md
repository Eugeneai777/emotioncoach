

# 为你的账号添加 admin 角色

## 当前状态
- 用户：炯谦（18898593978）
- user_id：`5e5cdc49-f922-499a-916e-b5d2cda0d051`
- 现有角色：`partner_admin`

## 操作
向 `user_roles` 表插入一条新记录，角色为 `admin`。原有的 `partner_admin` 角色保留不变。

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('5e5cdc49-f922-499a-916e-b5d2cda0d051', 'admin');
```

## 效果
- 你将同时拥有 `admin` + `partner_admin` 两个角色
- `AdminLayout.tsx` 中角色优先级为 `admin > partner_admin > content_admin`，因此登录后台将以 admin 身份进入
- 可访问所有管理模块，包括飞轮看板、用户管理、概览仪表板等
- 行业合伙人页面（`/admin/industry-partners`）也包含在 admin 路由中，不受影响

