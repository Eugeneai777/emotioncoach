

# 飞轮看板增强：MVP 产品数据 + 用户画像洞察

## 修正说明

### 1. 觉醒力测评定价修正

你说得对。代码中 `MidlifeAwakeningPage.tsx` 明确查询 `orders` 表 `package_key='midlife_awakening_assessment'` 且 `status='paid'`，这是一个**付费测评**。之前方案中将其标为"免费¥0"是错误的。

之前的误判来源：`MiniAppEntry.tsx` 中通过 `awakening_entries` 表检查完成状态（用于隐藏已完成项），而非通过 `orders` 表。这个表记录的是测评结果而非购买状态，导致我错误地将其归类为免费产品。

**修正**：产品售卖表中觉醒力测评与其他付费测评同等处理，数据来源统一为 `orders` 表。

### 2. 用户画像模块评估

你的需求本质是：**从"产品维度"的数据统计升级为"用户维度"的行为画像**。这是 MVP 阶段从"卖得怎样"到"谁在买、他们做了什么"的关键跃迁。

现有数据库完全支持：

| 行为维度 | 数据表 | 可聚合字段 |
|---------|--------|-----------|
| 测评记录 | `orders`(paid) + `midlife_awakening_assessments` + `emotion_health_assessments` | package_key, created_at |
| 训练营学习 | `training_camps` | status, completed_days, check_in_dates, current_day |
| 社区互动 | `community_posts` + `post_likes` | post_type, likes_count, created_at |
| AI 交互 | `conversations` | coach_type, created_at, metadata |

---

## 实现方案

**文件**：`src/components/admin/flywheel/FlywheelDashboard.tsx`

在现有漏斗图下方追加 **3个模块**：

### 模块 1：MVP 产品售卖概览

```text
┌──────────────────────────────────────────────┐
│  📊 MVP 产品售卖概览（近30天）                │
├──────────────┬───────┬────────┬──────────────┤
│ 产品         │ 订单数│ 收入   │ 独立用户      │
├──────────────┼───────┼────────┼──────────────┤
│ 💰 财富卡点测评│      │ ¥xxx  │              │
│ 💚 情绪健康测评│      │ ¥xxx  │              │
│ 🧭 觉醒力测评 │      │ ¥xxx  │              │
│ ⚡ 7天有劲营  │      │ ¥xxx  │              │
│ 🌟 身份绽放营 │      │ ¥xxx  │              │
└──────────────┴───────┴────────┴──────────────┘
```

数据源：`orders` 表 `status='paid'`，按 `package_key` 分组。

### 模块 2：训练营学习洞察

与之前方案一致：活跃营数、完营数、平均完课率、今日打卡、7天流失。数据源：`training_camps` 表。

### 模块 3：用户画像速览（新增）

**设计思路**：以用户列表形式展示近期活跃用户，每行聚合该用户的多维行为标签，点击可展开/跳转查看详情。

```text
┌─────────────────────────────────────────────────────────┐
│  👤 活跃用户画像（近30天有行为的用户）                      │
├────────┬──────────────────────────────┬──────────────────┤
│ 用户    │ 行为标签                     │ 操作             │
├────────┼──────────────────────────────┼──────────────────┤
│ 张三    │ 🏕️营Day5 💰已测 🤖AI×12轮  │ [查看详情]        │
│ 李四    │ 💚已测 📝社区×3 🏕️已完营    │ [查看详情]        │
└────────┴──────────────────────────────┴──────────────────┘
```

**行为标签生成逻辑**：
- **测评**：查 `orders` 表 paid 记录，按 package_key 生成 "💰已测"/"💚已测"/"🧭已测" 标签
- **训练营**：查 `training_camps` 表，生成 "🏕️营Day{n}" 或 "🏕️已完营" 标签
- **社区**：查 `community_posts` 表 count，生成 "📝社区×{n}" 标签
- **AI交互**：查 `conversations` 表 count，生成 "🤖AI×{n}轮" 标签

**"查看详情" 点击行为**：展开一个 Drawer/Dialog，列出该用户的：
1. 已完成测评列表（名称+时间），可点击跳转结果页
2. 训练营状态（打卡天数/总天数，最近打卡日期）
3. 社区帖子列表（标题+时间），可跳转帖子
4. AI 对话摘要（coach_type + 对话数 + 最近对话时间）

### 技术细节

- 用户画像查询：先从 `orders`/`training_camps`/`community_posts`/`conversations` 四表各查近30天有行为的 `user_id`，取并集后关联 `profiles` 获取展示名
- 单次查询量控制在 50 用户以内（LIMIT 50），按最近活跃时间排序
- 详情 Drawer 按需加载，点击时才查询该用户的具体记录
- 跳转链接：测评结果跳 `/admin/users?user={id}`，社区帖子跳 `/community/post/{id}`

### 涉及文件
- `src/components/admin/flywheel/FlywheelDashboard.tsx` — 追加3个模块（产品售卖、学习洞察、用户画像）
- 新建 `src/components/admin/flywheel/UserProfileDrawer.tsx` — 用户详情抽屉组件

