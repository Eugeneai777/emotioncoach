

## 亲子教练 × 小劲AI 体系融合方案

### 现状分析

当前两个系统是**割裂**的：

```text
亲子教练 (ParentCoach)              小劲AI (Xiaojin)
├── TeenModeEntryCard               ├── XiaojinHome (独立首页)
├── TeenInviteShareDialog           ├── IntroShareDialog (不同分享组件)
├── TeenUsageStats (查 teen_usage_logs) ├── useXiaojinQuota (localStorage)
└── parent_teen_bindings (DB)       └── 无数据回传给家长
```

问题：家长在亲子教练页看不到孩子在小劲AI的任何使用情况；邀请卡片有两套（TeenInviteShareDialog vs IntroShareDialog）。

### 融合目标

```text
亲子教练 (家长端统一入口)
├── 对话教练 (现有)
├── 孩子专区入口 → 统一邀请卡片 → 小劲AI
├── 孩子情绪周报卡片 (新增，数据来自小劲AI)
└── 训练营 / 通知 (现有)
```

### 实现方案

#### 1. 数据回传：小劲AI 情绪数据上报

**新建数据库表** `xiaojin_mood_logs`：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | PK |
| parent_user_id | uuid | 家长ID（从URL `from=parent_{userId}` 提取） |
| session_id | text | localStorage 生成的匿名会话ID |
| mood_label | text | 情绪标签（如"开心""焦虑"） |
| intensity | smallint | 情绪强度 1-5 |
| feature_used | text | 使用的功能（mood/talent/future/challenge/voice） |
| created_at | timestamptz | 时间戳 |

RLS：允许 anon insert（孩子无登录）；authenticated select 限 `parent_user_id = auth.uid()`。

**修改小劲AI功能页**：每次交互结束时，从 URL 提取 `parent_{userId}`，将情绪标签匿名上报（不含对话内容）。

#### 2. 统一邀请卡片

**修改 `TeenModeEntryCard`**：将分享按钮改为生成 `/xiaojin?from=parent_{userId}` 链接，复用 `TeenInviteShareDialog` 但目标URL统一指向小劲AI。

当前 `TeenInviteShareDialog` 生成的链接是 `/teen-space?token=xxx`，需改为 `/xiaojin?from=parent_{userId}`，使邀请流程与小劲AI完全打通。

#### 3. 家长端：孩子情绪周报卡片

**新建组件** `XiaojinMoodReport.tsx`，放在 `TeenModeEntryCard` 内（已绑定状态时显示）：

- 查询 `xiaojin_mood_logs` 近7天数据
- 调用 AI 生成自然语言摘要（如"本周情绪整体稳定，有2次轻微焦虑"）
- 展示情绪趋势折线图（复用 recharts）
- 隐私提示：仅显示趋势，不含对话内容

#### 4. 文件变更清单

| 文件 | 变更 |
|------|------|
| 数据库迁移 | 新建 `xiaojin_mood_logs` 表 + RLS |
| `src/components/parent-coach/TeenModeEntryCard.tsx` | 分享链接改为 `/xiaojin?from=parent_{userId}`；已绑定时显示情绪周报 |
| `src/components/parent-coach/TeenInviteShareDialog.tsx` | 目标URL统一为小劲AI链接 |
| `src/components/parent-coach/XiaojinMoodReport.tsx` | **新建** — 孩子情绪周报卡片 |
| `src/hooks/useChildMoodReport.ts` | **新建** — 查询+AI摘要 |
| `src/pages/xiaojin/XiaojinMood.tsx` | 交互结束时上报情绪标签 |
| `src/pages/xiaojin/XiaojinTalent.tsx` | 同上 |
| `src/pages/xiaojin/XiaojinFuture.tsx` | 同上 |
| `src/pages/xiaojin/XiaojinChallenge.tsx` | 同上 |
| `src/pages/xiaojin/XiaojinHome.tsx` | 解析 `from=parent_{userId}` 格式，存入 localStorage 供子页面使用 |
| Edge Function `xiaojin-mood-summary` | **新建** — AI生成周度情绪摘要 |

