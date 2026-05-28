## 目标

在管理后台 `/admin/human-coaches`（真人教练管理）页面新增第三条申请路径：**管理员手动录入教练信息**，直接创建一条 `human_coaches` 记录，可选择直接置为 `approved` 或 `pending`。

## 现有路径回顾

1. 用户自申请：`/become-coach`（self）
2. 已是教练代他人申请：`/become-coach?mode=proxy`
3. **新增：管理员后台手动录入**

## 改动范围

### 1. `HumanCoachesManagement.tsx`
- 在页头 `actions` 区新增按钮「+ 手动录入教练」，点击打开 `AdminCreateCoachDialog`。
- 提交成功后刷新 `human-coaches-stats` 和列表 query。

### 2. 新增 `src/components/admin/human-coaches/AdminCreateCoachDialog.tsx`
表单字段（参考 `CoachEditDialog` 风格）：
- **必填**：姓名、手机号（11 位，写入 `phone` 和 `claim_phone`，`claim_country_code` 默认 `+86`）
- **可选**：头像（复用 `CoachPhotoUploader`）、职称 title、简介 bio、从业年限、专长 specialties（标签）、价格档位 price_tier_id、admin_note
- **状态选择**：单选「直接通过(approved)」或「列入待审核(pending)」，默认 approved
- 提交逻辑：
  - 客户端校验姓名 + 11 位手机号
  - `insert into human_coaches`：
    - `name`, `phone`, `claim_phone`, `claim_country_code='+86'`
    - `status`：根据选择填 approved / pending
    - 若 approved：同时设置 `is_verified=true`, `verified_at=now()`, `is_accepting_new=true`, `trust_level=1`
    - `submitted_by_user_id = 当前管理员 user.id`（标识录入来源）
    - 其他可选字段按填写写入
  - `.select().single()` 拿回 coach
  - 若状态为 approved 且选了 price_tier_id，写入 `price_tier_id`、`price_tier_set_at`、`price_tier_set_by`
  - 自动创建一条默认 `coach_services`（参考代申请流程中的默认服务逻辑，避免列表显示异常）
  - 错误统一通过 `extractEdgeFunctionError` 提取
- 成功后 toast 提示、关闭对话框、刷新统计与列表

### 3. RLS 校验（只读检查，无需迁移）
- `human_coaches` INSERT：管理员（has_role admin）应已允许；如不允许则补一条 admin INSERT 策略。
- `coach_services` INSERT：管理员可代写；若策略仅限 coach 自己，沿用 `coach_id` 由当前管理员 submitted_by 角色逻辑或补 admin 策略。
- 实际实施时会先 `select` 现有策略，若缺失才补迁移；目前预期不需要新迁移。

## 技术细节

```text
HumanCoachesManagement
 ├─ actions: <Button onClick={openCreateDialog}>手动录入教练</Button>
 └─ <AdminCreateCoachDialog open onClose refetch />
       ├─ 表单 (姓名/手机/状态/头像/title/bio/经验/标签/档位/备注)
       ├─ submit:
       │     insert human_coaches → coachId
       │     [若 approved] update price_tier 字段
       │     insert coach_services (默认一条)
       └─ onSuccess: queryClient.invalidateQueries(['human-coaches-stats'])
                                 .invalidateQueries(['coach-applications'])
                                 .invalidateQueries(['approved-coaches'])
```

## 验收

- 管理员在 `/admin/human-coaches` 点击「手动录入教练」可打开对话框
- 填入姓名 + 11 位手机号即可提交，默认创建 approved 教练并出现在「已通过」Tab；选择 pending 时出现在「待审核」Tab
- 列表/统计数字立即刷新
- 不影响现有自申请 / 代申请链路