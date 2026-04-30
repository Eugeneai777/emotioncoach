# 管理员模拟登录用户(Impersonation)— 实施计划 V2

按已确认方案实施,不限时长 + 跨端(电脑/手机) + 仅 admin 可用 + 完整审计 + 红色横幅警示 + 模拟期间禁用敏感操作。

## 1. 数据库迁移

新建审计表 `admin_impersonation_logs`:
```sql
CREATE TABLE public.admin_impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_display_name TEXT,
  target_phone TEXT,
  reason TEXT NOT NULL,
  magic_link_token TEXT,
  opened_via TEXT,           -- 'web' | 'qrcode' | 'copy'
  admin_ip TEXT,
  admin_user_agent TEXT,
  target_ip TEXT,
  target_user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.admin_impersonation_logs ENABLE ROW LEVEL SECURITY;

-- 仅 admin 可读
CREATE POLICY "Admins can view impersonation logs"
  ON public.admin_impersonation_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 不写 INSERT/UPDATE/DELETE policy → 仅 service_role 可写
CREATE INDEX idx_admin_impersonation_admin ON public.admin_impersonation_logs(admin_user_id, started_at DESC);
CREATE INDEX idx_admin_impersonation_target ON public.admin_impersonation_logs(target_user_id, started_at DESC);
CREATE INDEX idx_admin_impersonation_token ON public.admin_impersonation_logs(magic_link_token);
```

## 2. Edge Function:`admin-impersonate-user`

单一函数,支持三种 action:

- **`search`**: 入参 `{ query }` (昵称模糊或手机号 ilike 匹配),返回最多 20 个候选。
- **`generate`**: 入参 `{ targetUserId, reason, openedVia }`
  - 二次校验调用者为 `admin`
  - 拒绝模拟其他 admin
  - `auth.admin.getUserById` 取 email
  - `auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: SITE_URL + '/?impersonating=1' } })` 生成单次链接
  - 写入审计日志(admin_id、target_id、reason、token、IP、UA)
  - 返回 `actionLink`
- **`end`**: 入参 `{ token }`,根据 token 回写 `ended_at`(任何登录用户可调,因为是退出自己被模拟的会话)

## 3. 后台 UI:`AdminImpersonation.tsx`

新增系统配置分组下的"模拟登录用户"模块,路由 `/admin/impersonate`:

- **搜索框**: 输入昵称/手机号 → 调 search → 候选列表(头像 + 昵称 + 手机号)
- **选择用户后**: 展示「排查原因」必填输入框(>=4字)
- **生成按钮**: 调 generate → 显示三种打开方式:
  - 💻 **新标签页打开**(PC 端排查)— 内部弹窗提示「会先退出当前 admin 会话」
  - 📱 **显示二维码**(手机扫码)— 用 `qrcode` lib 渲染
  - 📋 **复制链接**(发同事/微信内打开)
- **模拟历史**: 折叠面板,展示最近 50 条记录 + 结束时间

## 4. 命令面板入口

在 `adminNavRegistry.ts` 的 KEYWORDS_MAP 加 `impersonate: ["模拟", "impersonate", "登录用户", "排查", "扫码登录", "用户登录"]`,在 `AdminSidebar.tsx` 系统配置组追加 `{ key: "impersonate", label: "模拟登录用户", path: "/admin/impersonate", icon: Eye }`,仅 `roles: ['admin']`。

## 5. 全局横幅 + 会话切换

新建 `src/components/ImpersonationBanner.tsx` + `src/hooks/useImpersonation.ts`:

- 检测 URL `?impersonating=1` 或 sessionStorage `impersonating_token`,设置全局 state
- 红色顶部横幅(`fixed top-0 z-[9999]`)固定显示:
  - 「⚠️ 你正在以 [昵称/手机号] 身份浏览 — 操作即真实操作 — [退出模拟]」
- 点击「退出模拟」: 调 `admin-impersonate-user` action=end → `supabase.auth.signOut()` → `localStorage` 清除 → 跳 `/admin`(管理员需重新登录后台)
- 处理回调: 检测到 `?impersonating=1` 时,**先 signOut 当前 session**(避免覆盖 admin 自己),再让 magic link 流程接管。实际上 magic link 已自动登录目标用户,我们只需:
  1. 抓取 URL hash 中的 `access_token`(supabase 默认行为)
  2. 标记 sessionStorage `impersonating_token = <token>`
  3. 主体内容 padding-top 增加 40px 防遮挡

## 6. 模拟期间禁用敏感操作

通过 `useImpersonation()` hook 暴露 `isImpersonating` 布尔。在以下页面/操作处加守卫:
- 支付入口(PayEntry、StartCampDialog 等已有支付的页面)
- 修改密码(ChangePassword)
- 注销账号、提现(若有)

简单实现: 这些组件 import `useImpersonation`,如果 `isImpersonating === true` 则按钮 disabled + toast「模拟登录会话不可执行此操作」。

本次先在**支付入口**与**修改密码页**接入,其他后续再补。

## 7. App.tsx 集成

在 `<BrowserRouter>` 内 `<Toaster />` 之后挂载 `<ImpersonationBanner />`。挂载位置在路由之外,确保所有页面均显示。

## 涉及文件汇总

**新建:**
- 迁移: `admin_impersonation_logs` 表 + RLS + 索引
- `supabase/functions/admin-impersonate-user/index.ts`
- `src/components/admin/AdminImpersonation.tsx`
- `src/components/ImpersonationBanner.tsx`
- `src/hooks/useImpersonation.ts`

**修改:**
- `src/components/admin/AdminSidebar.tsx`(系统配置加入口)
- `src/components/admin/adminNavRegistry.ts`(KEYWORDS_MAP 加 impersonate)
- `src/components/admin/AdminLayout.tsx`(挂载 `<AdminImpersonation />` 路由)
- `src/App.tsx`(挂载 `<ImpersonationBanner />`)
- `src/pages/PayEntry.tsx`、`src/pages/ChangePassword.tsx`(模拟会话禁用守卫)
- `package.json`(新增 `qrcode` + `@types/qrcode`)

## 安全要点重申
1. 仅 `admin` 角色可访问入口(侧边栏 + 命令面板)
2. Edge Function 内 service_role 二次校验
3. 拒绝模拟其他 admin 账号
4. 必填排查原因 + 完整审计
5. 红色横幅常驻、不可关闭(只能退出)
6. 模拟期间禁用支付/改密
7. 跨端通过二维码/复制链接,不传账号密码

实施后我会触发部署 edge function,并提示用户先执行迁移再使用。
