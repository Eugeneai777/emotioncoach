
# 团队教练专区功能计划

## 功能概述

为绽放合伙人创建一个团队教练功能模块，允许合伙人发布团队辅导课程，学员可以浏览、报名并付费参加。

## 核心需求

| 角色 | 功能 |
|------|------|
| 绽放合伙人 | 创建/编辑/管理团队教练课程（主题、内容、时间、人数上限、价格） |
| 学员 | 浏览课程列表、查看详情、报名付费 |
| 系统 | 人数控制、支付处理、不可退款规则 |

## 数据库设计

### 新建表 1: `team_coaching_sessions`（团队教练课程）

```text
┌──────────────────────────────────────────────────────────────┐
│ team_coaching_sessions                                        │
├──────────────────────────────────────────────────────────────┤
│ id                UUID PRIMARY KEY                           │
│ partner_id        UUID REFERENCES partners(id) NOT NULL      │
│ title             TEXT NOT NULL                              │
│ description       TEXT                                       │
│ content           TEXT (课程详细内容)                          │
│ cover_image_url   TEXT                                       │
│ session_date      DATE NOT NULL                              │
│ start_time        TIME NOT NULL                              │
│ end_time          TIME NOT NULL                              │
│ duration_minutes  INTEGER                                    │
│ max_participants  INTEGER NOT NULL (人数上限)                  │
│ current_count     INTEGER DEFAULT 0 (当前报名人数)             │
│ price             DECIMAL(10,2) DEFAULT 0 (0为免费)            │
│ is_free           BOOLEAN DEFAULT false                      │
│ location_type     TEXT ('online' | 'offline')                │
│ location_info     TEXT (线下地址或线上链接)                     │
│ status            TEXT DEFAULT 'draft' (draft/published/completed/cancelled) │
│ created_at        TIMESTAMPTZ DEFAULT now()                  │
│ updated_at        TIMESTAMPTZ DEFAULT now()                  │
└──────────────────────────────────────────────────────────────┘
```

### 新建表 2: `team_coaching_enrollments`（报名记录）

```text
┌──────────────────────────────────────────────────────────────┐
│ team_coaching_enrollments                                     │
├──────────────────────────────────────────────────────────────┤
│ id                UUID PRIMARY KEY                           │
│ session_id        UUID REFERENCES team_coaching_sessions(id) │
│ user_id           UUID REFERENCES auth.users(id)             │
│ order_id          UUID REFERENCES orders(id) (付费课程)        │
│ amount_paid       DECIMAL(10,2) DEFAULT 0                    │
│ payment_status    TEXT ('pending'|'paid'|'free')             │
│ enrolled_at       TIMESTAMPTZ DEFAULT now()                  │
│ attended          BOOLEAN DEFAULT false                      │
│ attendance_note   TEXT                                       │
│ UNIQUE(session_id, user_id)                                  │
└──────────────────────────────────────────────────────────────┘
```

### RLS 策略

**team_coaching_sessions:**
- 所有人可查看已发布（published）的课程
- 合伙人可管理自己创建的课程

**team_coaching_enrollments:**
- 用户可查看/创建自己的报名记录
- 合伙人可查看自己课程的所有报名记录

---

## 页面结构

### 1. 团队教练列表页 `/team-coaching`

**用途**: 学员浏览所有可报名的团队教练课程

**UI 设计**:
- 顶部标题 + 筛选（全部/免费/付费）
- 课程卡片列表
  - 封面图、标题、合伙人信息
  - 时间、人数进度（如 12/20）
  - 价格（免费标签 或 ¥199）
- 点击进入详情页

### 2. 课程详情页 `/team-coaching/:id`

**用途**: 查看课程详情并报名

**UI 设计**:
- 课程封面大图
- 标题 + 主持人信息
- 时间、地点、参与人数
- 课程内容描述
- 底部固定「立即报名」按钮
  - 免费课程：直接报名
  - 付费课程：唤起支付弹窗

### 3. 合伙人管理页 `/partner/team-coaching`

**用途**: 绽放合伙人管理自己的团队教练课程

**UI 设计**:
- 「+ 创建课程」按钮
- 课程管理列表（草稿/已发布/已完成）
- 每个课程卡片可编辑/查看报名/取消

### 4. 创建/编辑课程弹窗

**字段**:
- 标题（必填）
- 封面图（可选）
- 课程描述
- 详细内容
- 日期 + 时间
- 人数上限
- 价格（0 = 免费）
- 线上/线下 + 地点信息

---

## 文件结构

```text
src/
├── pages/
│   ├── TeamCoaching.tsx              # 学员浏览列表
│   ├── TeamCoachingDetail.tsx        # 课程详情
│   └── partner/
│       └── TeamCoachingManage.tsx    # 合伙人管理
│
├── components/
│   └── team-coaching/
│       ├── TeamCoachingCard.tsx      # 课程卡片
│       ├── TeamCoachingForm.tsx      # 创建/编辑表单
│       ├── EnrollButton.tsx          # 报名按钮
│       ├── EnrollmentList.tsx        # 报名列表
│       └── TeamCoachingPayDialog.tsx # 付费弹窗
│
├── hooks/
│   └── useTeamCoaching.ts            # 数据获取 hooks
```

---

## 关键流程

### 学员报名流程

```text
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 浏览课程列表 │───▶│ 查看课程详情 │───▶│ 点击报名    │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
                   ┌─────────────────────────┼─────────────────────────┐
                   │                         │                         │
              免费课程                   付费课程                   人数已满
                   │                         │                         │
                   ▼                         ▼                         ▼
           ┌───────────────┐       ┌───────────────┐         ┌───────────────┐
           │ 直接创建报名   │       │ 唤起支付弹窗   │         │ 显示已满提示   │
           └───────┬───────┘       └───────┬───────┘         └───────────────┘
                   │                       │
                   │                       ▼
                   │              ┌───────────────┐
                   │              │ 微信支付      │
                   │              └───────┬───────┘
                   │                       │
                   ▼                       ▼
           ┌──────────────────────────────────────┐
           │          创建报名记录                 │
           │          更新 current_count + 1      │
           └──────────────────────────────────────┘
```

### 不可退款说明

- 付费课程支付成功后，费用不予退还
- 在支付确认页面明确显示退款政策
- 报名记录中保留 `payment_status` 但不提供退款接口

---

## 入口设置

### 学员入口
- **主页快捷入口**: 在首页添加「团队教练」卡片
- **菜单入口**: 汉堡菜单或教练空间页面

### 合伙人入口
- **合伙人中心**: 在绽放合伙人面板添加「团队教练管理」Tab 或卡片

---

## 技术细节

### 数据查询 Hook

```typescript
// useTeamCoaching.ts
export function usePublishedSessions() {
  return useQuery({
    queryKey: ['team-coaching-sessions', 'published'],
    queryFn: async () => {
      const { data } = await supabase
        .from('team_coaching_sessions')
        .select(`
          *,
          partners:partner_id (
            id, partner_code,
            profiles:user_id (display_name, avatar_url)
          )
        `)
        .eq('status', 'published')
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true });
      return data;
    },
  });
}
```

### 报名逻辑

```typescript
async function enrollSession(sessionId: string, isFree: boolean) {
  // 1. 检查是否已满
  const session = await getSession(sessionId);
  if (session.current_count >= session.max_participants) {
    throw new Error('课程已满');
  }
  
  // 2. 检查是否已报名
  const existing = await checkEnrollment(sessionId, userId);
  if (existing) {
    throw new Error('您已报名此课程');
  }
  
  // 3. 创建报名（免费直接成功，付费需支付回调后确认）
  if (isFree) {
    await createEnrollment(sessionId, userId, 'free');
    await incrementCount(sessionId);
  } else {
    // 触发支付流程
    return { needPayment: true, sessionId };
  }
}
```

---

## 实现步骤

1. **数据库迁移**: 创建 `team_coaching_sessions` 和 `team_coaching_enrollments` 表
2. **RLS 策略**: 配置访问控制
3. **Hooks**: 实现 `useTeamCoaching.ts`
4. **学员页面**: 
   - `TeamCoaching.tsx` 列表页
   - `TeamCoachingDetail.tsx` 详情页
5. **组件**:
   - `TeamCoachingCard.tsx`
   - `EnrollButton.tsx`
   - `TeamCoachingPayDialog.tsx`
6. **合伙人管理**:
   - `TeamCoachingManage.tsx`
   - `TeamCoachingForm.tsx`
7. **路由注册**: 在 `App.tsx` 添加路由
8. **入口链接**: 在首页和合伙人中心添加入口

---

## 权限验证

| 操作 | 权限要求 |
|------|----------|
| 浏览课程 | 无需登录 |
| 报名课程 | 需要登录 |
| 创建课程 | 绽放合伙人 (`partner_type = 'bloom'`) |
| 编辑课程 | 课程创建者 |
| 查看报名列表 | 课程创建者 |
