

## 修复 真人教练重复申请 Bug

### 根因

`src/pages/BecomeCoach.tsx` 的 `handleSubmit` 直接 `INSERT` 一条新 `human_coaches` 记录，**没有任何重复校验**，且数据库 `human_coaches.user_id` 字段**无唯一约束**。导致同一用户每点一次「提交」都会新建一条记录。

数据库现状（user_id `4b450663...`）：
- 1 条 `approved`（09:34 创建，13:21 通过）
- 2 条 `pending` 重复（10:44 / 11:07）

### 评估：业务上的合理处理

| 场景 | 期望行为 |
|---|---|
| 用户已有 `approved` 记录 | 拒绝再次提交，提示「您已通过审核，请前往教练后台编辑资料」 |
| 用户已有 `pending` 记录 | **以最新一次提交为准** —— 用 UPDATE 覆盖原 pending 记录，证书/服务表先删后插（避免孤儿数据） |
| 用户已有 `rejected` 记录 | 允许重新申请，UPDATE 原记录为 pending（保留审核历史可追溯） |
| 用户首次申请 | INSERT 新记录（现有逻辑） |

### 修复方案（3 部分）

#### 1 · 数据库层 · 加唯一约束（防御性，杜绝并发重复）

```sql
-- 同一用户最多 1 条 human_coaches 记录
ALTER TABLE public.human_coaches
ADD CONSTRAINT human_coaches_user_id_unique UNIQUE (user_id);
```

> 上线前先清理历史脏数据：保留每位 user_id 的最新一条（按 created_at DESC），其余软删除或硬删除关联的 certifications / services。

#### 2 · 数据清理脚本 · Lisa 现有 3 条记录

保留最早的 `approved` 记录（id `a02a5395...`，已上线给前端用），删除 2 条孤立 `pending` 重复及其关联子表数据：

```sql
-- 删除 2 条孤立 pending 重复（含级联子数据）
DELETE FROM coach_certifications WHERE coach_id IN ('66893216-...','39a3ea9c-...');
DELETE FROM coach_services       WHERE coach_id IN ('66893216-...','39a3ea9c-...');
DELETE FROM human_coaches        WHERE id        IN ('66893216-...','39a3ea9c-...');
```

#### 3 · 前端层 · `src/pages/BecomeCoach.tsx` 重写 `handleSubmit`

提交前先查 `human_coaches WHERE user_id = ?`：

```text
existing record?
├─ status='approved'  → 弹 toast「您已通过审核」 + 跳 /coach-dashboard
├─ status='pending'   → UPDATE 覆盖 + 删除旧 certs/services 后重新 INSERT
├─ status='rejected'  → UPDATE 原记录 → status='pending' + 覆盖资料 + 重置 certs/services
└─ 不存在              → 现有 INSERT 流程（不变）
```

实现要点：
- 用一次 `select('id, status').eq('user_id', user.id).maybeSingle()`
- 走 UPDATE 分支时，先 `DELETE FROM coach_certifications WHERE coach_id = ?` 和 `coach_services`，再 INSERT 新数据，确保「以最新一次提交为准」
- 所有 update / delete 语句加 `.select()` 校验是否被 RLS 静默拒绝（遵循项目客户端 SDK CRUD 加固标准）
- 提交成功后跳转逻辑不变

### 不动的内容

- 邀请链接校验（`inviteStatus` / `invitationData`）
- 表单组件（基础信息 / 证书上传 / 头像）
- 管理后台审核流程
- 前端 `/human-coaches` 列表（已修复 approved 可见）

### 验证标准

1. 执行清理脚本后，管理后台「待审核」列表 Lisa 的 2 条重复消失，仅保留「已通过」1 条
2. 同一用户尝试第二次提交申请：
   - 若已通过 → 弹提示并跳教练后台
   - 若待审核 → 旧 pending 记录被覆盖为最新提交（id 不变），证书/服务表替换为新数据
   - 若被拒 → 原记录复活为 pending，可重新审核
3. 数据库层 UNIQUE 约束生效：任何绕过前端的并发 INSERT 都会失败
4. 管理后台统计卡片数字与列表完全一致，不再出现同名重复

