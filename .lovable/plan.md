

## 教练资料管理标准 · 通过专属链接 + 编辑触发再审核

### 商业架构评估

**放弃「我的」页面入口的理由（合理）**：
1. **目标人群错位**：教练是 B 端供给方（极少数 < 5%），普通用户是 C 端需求方（绝大多数）。在 C 端通用入口加 B 端管理卡片，会增加普通用户认知负担，且需要额外的条件渲染逻辑维护
2. **流量归因清晰**：邀请链接 `?invite=xxx` 自带教练招募归因（合伙人 / 渠道分成可追溯），通过通用入口绕开链接会破坏归因链路
3. **品牌隔离**：教练入驻是独立品牌动作，与用户日常使用心智应隔离，避免「人人都能当教练」的廉价感
4. **维护成本**：单一入口 = 单一真相源，未来流程升级（如加入合同签署、证书复审）只需改一处

**保留专属链接 + 复用 `/become-coach` 作为「申请 + 编辑」统一页面（最优解）**：用同一个 URL 同时承载首次申请、补充资料、修改资料三种场景，用现有数据状态驱动 UI 与流程。

### 三种场景的统一处理

| 场景 | 数据库状态 | 页面行为 | 提交后 |
|---|---|---|---|
| **首次申请** | 无 `human_coaches` 记录 | 空表单（现状） | INSERT → status=`pending` |
| **审核中编辑** | status=`pending` | 表单预填旧数据，顶部黄条「审核中 · 编辑后将重新排队」 | UPDATE 覆盖 + 删旧 certs/services 重插 → status 保持 `pending`，updated_at 刷新 |
| **已通过编辑** | status=`approved` | 表单预填旧数据，顶部蓝条「已认证 · 修改资料需重新审核」 | UPDATE 覆盖 → status **回退为 `pending`**，触发再审核（管理员后台收到新申请） |
| **被拒重申** | status=`rejected` | 表单预填旧数据，顶部红条显示拒绝原因 | UPDATE 覆盖 → status=`pending` |

> 已通过教练编辑后**强制回退到 pending**：这是商业逻辑必须项 —— 任何资料变更（尤其是头像、价格档次、证书）都可能影响平台对教练的认证判断，必须由管理员二次确认，杜绝资料偷换风险。

### 修复方案（3 处改动）

#### 1 · `src/pages/BecomeCoach.tsx` · 重构为「申请 + 编辑」统一页

页面加载时先查 `human_coaches WHERE user_id = ?`：

- **若存在记录** → 用 `coach.{name, bio, avatar_url, specialties, ...}` 预填所有 step 表单（基础信息、证书、服务）
- **顶部状态横幅**（取代当前空白头）：
  - `pending` → 黄底：「⏳ 您的申请正在审核中，编辑后将重新排队，预计 1-2 个工作日反馈」
  - `approved` → 蓝底：「✅ 您已通过认证，修改资料需重新审核，期间预约不受影响」
  - `rejected` → 红底：「❌ 上次审核未通过：{rejected_reason}，请补充资料后重新提交」
- **CTA 文案动态切换**：
  - 无记录 → "提交申请"
  - 有记录 → "保存并重新提交审核"

`handleSubmit` 已有 4 分支逻辑（上次需求已实现），本次只需补**已通过 → 强制回退 pending**：

```ts
if (existing?.status === 'approved') {
  // 不再 navigate('/coach-dashboard') 拦截
  // 改为 UPDATE 覆盖 + status 回退 pending + 删旧 certs/services 重插
  await supabase.from('human_coaches')
    .update({ ...payload, status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', existing.id)
    .select();
}
```

所有 update / delete 加 `.select()` 校验返回行数（项目 SDK 加固标准）。

#### 2 · `/coach-dashboard` 加「编辑资料」入口

文件：`src/components/coach-dashboard/CoachProfileSettings.tsx` 顶部加一个外链按钮：

```text
┌─────────────────────────────────────┐
│ 📝 修改资料 / 头像                    │
│    点击进入资料编辑（修改后需重新审核）│
└─────────────────────────────────────┘
```

按钮 `onClick={() => navigate('/become-coach?invite=' + coachInviteCode)}`，复用同一申请页。
> 教练后台不再独立做表单编辑，统一收口到 `/become-coach`，避免两套表单逻辑分裂。

#### 3 · 管理后台 · 「待审核」列表区分「新申请」与「修改申请」

文件：`src/components/admin/HumanCoachesAdmin.tsx`（或对应列表组件）

在 pending 列表的每条记录上加标签：
- `created_at == updated_at` → 「🆕 新申请」
- `created_at != updated_at` → 「✏️ 修改申请」+ 显示上次审核状态（来自新增字段 `previous_status` 或简单依据 `approved_at IS NOT NULL`）

> 这能让管理员一眼区分新教练 vs 老教练资料更新，提升审核效率。可选：在记录详情里增加「查看变更历史」（diff 旧版与新版字段），但本期可不做。

### 数据库层（无需改动）

- `human_coaches` 表已有 `updated_at` 字段，触发器自动维护
- 已有 `user_id` UNIQUE 约束，确保单用户单记录
- 已有 admin RLS（可改 status）+ 教练自己 update 自己的 RLS
- 价格同步触发器已就位

### 不动的内容

- `MyPage` 不加教练入口（取消上一轮设想）
- 邀请链接归因系统
- 管理后台审核流程（点击「通过」时仍写 status=`approved`）
- 价格档次同步触发器
- 重复申请唯一约束

### 验证标准

1. **首次申请**：访问邀请链接 → 空表单 → 提交后 pending
2. **审核中编辑**：再次访问邀请链接 → 表单预填 + 黄底提示 → 修改后保存 → 数据库 updated_at 刷新，status 仍 pending
3. **已通过编辑**：Lisa（已 approved）访问邀请链接 → 表单预填 + 蓝底提示 → 修改头像后保存 → status 自动回退 pending，管理后台「待审核」列表出现一条「✏️ 修改申请」
4. **教练后台跳转**：`/coach-dashboard` 个人设置出现「修改资料」按钮，点击跳 `/become-coach?invite=...`
5. **MyPage** 普通用户视图无任何教练相关入口（彻底隔离 B/C 端）
6. **归因**：所有编辑动作都经过邀请链接，合伙人归因不丢失

