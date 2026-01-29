

# 绽放合伙人批量导入与注册流程方案

## 一、当前现状分析

### 已有能力
| 功能 | 有劲合伙人 | 绽放合伙人 |
|:-----|:----------|:----------|
| 单个添加 | ✅ `AddPartnerDialog.tsx` | ❌ 无 |
| 批量导入 | ❌ 无 | ❌ 无 |
| 付款自动创建 | ✅ `wechat-pay-callback` | ❌ 未实现 |
| 管理界面 | ✅ `PartnerManagement.tsx` | ✅ `AdminBloomPartnerDelivery.tsx`（仅交付管理）|

### 数据结构
绽放合伙人需要同时创建两条记录：

1. **`partners` 表** - 合伙人身份记录
   - `partner_type = 'bloom'`
   - `partner_level = 'L0'`
   - `commission_rate_l1 = 0.30`
   - `commission_rate_l2 = 0.10`

2. **`bloom_partner_orders` 表** - 订单/交付记录
   - 默认金额 ¥19,800
   - 三个训练营交付状态跟踪

---

## 二、核心问题

### 批量导入场景分类

| 场景 | 说明 | 导入方式 |
|:-----|:-----|:---------|
| **已注册用户** | 用户已有系统账号（已微信注册/邮箱注册） | 直接用 User ID 导入 |
| **未注册用户** | 用户尚未在系统注册 | 需要邀请链接注册后关联 |

---

## 三、推荐流程

### 方案：「邀请码 + 自动关联」模式

```text
管理员批量上传 CSV（姓名、手机号）
         ↓
系统生成唯一邀请码 (partner_invitations 表)
         ↓
管理员分发邀请链接给合伙人
         ↓
合伙人扫码/点击链接进入注册页
         ↓
注册成功后自动关联为绽放合伙人
         ↓
同时创建 partners + bloom_partner_orders 记录
```

### 核心流程图

```text
┌─────────────────────────────────────────────────────────────────┐
│                   绽放合伙人批量导入流程                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [管理员]                                                       │
│      │                                                          │
│      ▼                                                          │
│   ┌──────────────┐                                              │
│   │ 上传 CSV 文件 │                                              │
│   │ (姓名,手机号) │                                              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────────────────────────────┐                      │
│   │ 生成邀请记录 (partner_invitations)    │                      │
│   │ - 唯一邀请码                         │                      │
│   │ - 手机号                             │                      │
│   │ - 合伙人类型 = bloom                 │                      │
│   │ - 状态 = pending                     │                      │
│   └──────┬───────────────────────────────┘                      │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────────┐                                          │
│   │ 导出邀请链接列表  │                                          │
│   │ /invite/BLOOM123 │                                          │
│   └──────┬───────────┘                                          │
│          │                                                      │
│   ───────┼─────────────────── 分发给合伙人 ──────────────────    │
│          │                                                      │
│   [合伙人]                                                       │
│          │                                                      │
│          ▼                                                      │
│   ┌──────────────────┐                                          │
│   │ 点击邀请链接      │                                          │
│   └──────┬───────────┘                                          │
│          │                                                      │
│          ▼                                                      │
│   ┌─────────────────────────────────────┐                       │
│   │ /invite/[code] 页面                  │                       │
│   │ - 显示"您已被邀请成为绽放合伙人"     │                       │
│   │ - 引导微信扫码注册                   │                       │
│   └──────┬──────────────────────────────┘                       │
│          │                                                      │
│          ▼                                                      │
│   ┌─────────────────────────────────────┐                       │
│   │ 微信注册/登录成功                    │                       │
│   │ - 读取 invite_code 参数             │                       │
│   │ - 调用 claim-partner-invitation     │                       │
│   └──────┬──────────────────────────────┘                       │
│          │                                                      │
│          ▼                                                      │
│   ┌─────────────────────────────────────┐                       │
│   │ 自动创建合伙人身份                   │                       │
│   │ - partners 记录                     │                       │
│   │ - bloom_partner_orders 记录         │                       │
│   │ - 更新 invitation 状态 = claimed    │                       │
│   └─────────────────────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、技术实现计划

### 1. 数据库变更

**新建 `partner_invitations` 表**

| 字段 | 类型 | 说明 |
|:-----|:-----|:-----|
| `id` | UUID | 主键 |
| `invite_code` | TEXT | 唯一邀请码（如 BLOOM7X3K9M）|
| `partner_type` | TEXT | 合伙人类型（bloom/youjin）|
| `invitee_name` | TEXT | 被邀请人姓名（可选）|
| `invitee_phone` | TEXT | 被邀请人手机号（可选）|
| `order_amount` | NUMERIC | 订单金额（默认 19800）|
| `status` | TEXT | 状态：pending / claimed / expired |
| `claimed_by` | UUID | 领取用户 ID |
| `claimed_at` | TIMESTAMPTZ | 领取时间 |
| `expires_at` | TIMESTAMPTZ | 过期时间（可选）|
| `created_by` | UUID | 创建管理员 ID |
| `created_at` | TIMESTAMPTZ | 创建时间 |

### 2. Edge Function

**新建 `claim-partner-invitation` 函数**

功能：
- 验证邀请码有效性
- 创建 `partners` 记录（type=bloom）
- 创建 `bloom_partner_orders` 记录
- 更新邀请状态为 claimed

### 3. 前端组件

**新建管理界面**

| 组件 | 功能 |
|:-----|:-----|
| `BloomPartnerBatchImport.tsx` | 批量导入对话框，支持 CSV 上传 |
| `BloomPartnerInvitationList.tsx` | 邀请记录列表，显示状态和链接 |

**新建用户端页面**

| 页面 | 路由 | 功能 |
|:-----|:-----|:-----|
| `PartnerInvitePage.tsx` | `/invite/:code` | 邀请落地页，引导注册 |

**修改注册流程**

| 文件 | 修改 |
|:-----|:-----|
| `WeChatOAuthCallback.tsx` | 注册成功后检查并处理 invite_code |
| `Auth.tsx` | 保存 invite_code 到 localStorage |

---

## 五、详细实现步骤

### 步骤 1：数据库迁移
创建 `partner_invitations` 表，包含 RLS 策略

### 步骤 2：批量导入功能
- 管理端 CSV 上传组件
- 批量生成邀请码
- 导出邀请链接列表

### 步骤 3：邀请落地页
- `/invite/:code` 页面
- 显示合伙人权益介绍
- 引导微信注册

### 步骤 4：注册后自动关联
- Edge Function 处理邀请码验证和关联
- 注册回调中调用关联逻辑

### 步骤 5：管理界面
- 查看所有邀请记录
- 筛选状态（待领取/已领取/已过期）
- 支持重新发送邀请链接

---

## 六、涉及文件清单

### 新建文件
| 文件路径 | 说明 |
|:---------|:-----|
| `src/components/admin/BloomPartnerBatchImport.tsx` | 批量导入对话框 |
| `src/components/admin/BloomPartnerInvitations.tsx` | 邀请管理列表 |
| `src/pages/PartnerInvitePage.tsx` | 邀请落地页 |
| `supabase/functions/claim-partner-invitation/index.ts` | 邀请领取处理 |

### 修改文件
| 文件路径 | 修改内容 |
|:---------|:---------|
| `src/components/admin/AdminLayout.tsx` | 添加绽放合伙人管理路由 |
| `src/components/admin/AdminSidebar.tsx` | 添加侧边栏入口 |
| `src/pages/WeChatOAuthCallback.tsx` | 注册后检查邀请码 |
| `src/App.tsx` | 添加 `/invite/:code` 路由 |

### 数据库迁移
- 创建 `partner_invitations` 表
- 添加 RLS 策略
- 创建唯一索引（invite_code）

---

## 七、CSV 导入格式示例

```csv
姓名,手机号,备注
张三,13800138001,首批合伙人
李四,13800138002,线下招募
王五,13800138003,
```

导入后生成：

| 邀请码 | 链接 | 状态 |
|:-------|:-----|:-----|
| BLOOM7X3K9M | https://xxx.app/invite/BLOOM7X3K9M | 待领取 |
| BLOOMH2P5RN | https://xxx.app/invite/BLOOMH2P5RN | 待领取 |
| BLOOM9K4TYQ | https://xxx.app/invite/BLOOM9K4TYQ | 待领取 |

---

## 八、预期效果

| 指标 | 效果 |
|:-----|:-----|
| 批量效率 | 一次上传可导入数百位合伙人 |
| 自动化 | 注册即激活，无需二次手动操作 |
| 可追踪 | 每个邀请链接状态可追踪 |
| 数据完整 | 自动同步创建双表记录 |

