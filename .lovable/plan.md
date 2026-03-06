

## 让行业合伙人自建 AI 教练

### 现状问题

- 行业合伙人（`partner_type = 'industry'`）目前 **没有绑定用户账号**（`user_id = NULL`），由管理员在后台创建和管理
- 教练模板（`coach_templates`）无归属概念，全部为系统级
- 合伙人中心（`/partner`）仅服务 bloom/youjin 类型

### 前置条件：行业合伙人需要绑定用户账号

行业合伙人必须先有用户账号才能登录自建教练。需要在管理后台的行业合伙人详情中支持绑定用户（通过手机号/邮箱查找并关联 `user_id`）。

### 方案设计

#### 1. 数据库变更

**coach_templates 表新增 3 列：**
- `created_by_partner_id` (uuid, nullable, FK → partners.id) — 归属合伙人
- `is_partner_coach` (boolean, default false) — 区分系统/合伙人教练
- `partner_coach_status` (text, default 'active') — 状态：draft / active / disabled

**RLS 策略：**
- 合伙人可 SELECT/INSERT/UPDATE 自己创建的教练（通过 `created_by_partner_id` 匹配）
- 合伙人推荐的用户可 SELECT 该合伙人的 active 教练

#### 2. 行业合伙人自服务入口

在 `/partner` 页面，当 `partner_type === 'industry'` 时，显示专属的行业合伙人面板，包含：

**"我的 AI 教练" 模块：**
- 教练卡片列表（展示已创建的教练，含状态标识）
- "AI 创建教练"按钮 → 复用 `AICoachCreator` 组件（简化版）
- 简易编辑：标题、描述、system_prompt、场景快选
- 每个合伙人限制创建 **3 个**教练

#### 3. 自动路由分配

合伙人教练自动生成路由：
- `page_route`: `/coach/ind_{partner_code}_{coach_key}`
- `history_route`: `/coach/ind_{partner_code}_{coach_key}/history`

#### 4. 用户端展示

通过 ref 进入的用户，在教练列表中额外看到该合伙人创建的 active 教练。

### 修改文件清单

| 类型 | 文件 | 说明 |
|------|------|------|
| DB | 迁移 SQL | coach_templates 新增 3 列 + RLS |
| 前端 | `src/pages/Partner.tsx` | 增加 industry 类型分支 |
| 新建 | `src/components/partner/IndustryPartnerDashboard.tsx` | 行业合伙人面板 |
| 新建 | `src/components/partner/PartnerCoachManager.tsx` | 教练列表+创建管理 |
| 新建 | `src/hooks/usePartnerCoaches.ts` | 合伙人教练 CRUD |
| 改 | `src/components/admin/IndustryPartnerManagement.tsx` | 支持绑定用户账号 |
| 改 | 教练列表页 | 合并展示合伙人专属教练 |
| 复用 | `AICoachCreator` + `generate-coach-template` | 传入 partner_id |

