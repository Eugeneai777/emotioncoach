## 收尾两项

### 1. 「我的代申请」列表 + 编辑入口（BecomeCoach 顶部）

**位置**：`src/pages/BecomeCoach.tsx` 顶部，邀请校验通过后、表单 Stepper 上方插入一张折叠卡片 `MyProxyApplicationsCard`。

**数据源**：
```ts
supabase
  .from("human_coaches")
  .select("id, name, status, admin_note, created_at, claim_phone, mode_hint")
  .eq("submitted_by_user_id", user.id)
  .is("deleted_at", null)
  .order("created_at", { ascending: false })
  .limit(20)
```

**展示**：
- 每行：教练名 + 状态徽标（待审核/已通过/已拒绝）+ 提交时间 + 操作按钮
- 状态映射颜色：`pending=secondary` / `approved=default(绿)` / `rejected=destructive`
- 被拒的展开 `admin_note` 显示拒绝原因
- 没有记录时整张卡片不渲染（避免新用户看到空状态）

**编辑入口**：
- `pending` / `rejected` 显示「继续编辑」按钮 → `navigate(\`/become-coach?invite=${inviteCode}&edit=${id}\`)`
- `approved` 不显示编辑按钮（已生效记录不允许在此页改，避免绕过审核；要改走教练后台）
- BecomeCoach 检测 `?edit=<id>`：在现有 `loadExisting` 逻辑里优先按 id 拉取该记录预填；保存时若是 `rejected` → 重置为 `pending` 并清空 `admin_note`（已有逻辑可复用，需确认）

**新增组件**：
- `src/components/coach-application/MyApplicationsCard.tsx` — 独立卡片，自含 query。

---

### 2. 死字段在公开详情页下架

**文件**：`src/pages/HumanCoachDetail.tsx`

经过排查，仅以下两个字段在前台真正渲染（其余 `training_background / intro_video_url / case_studies` 已无 UI 引用，仅在 types/hook 里残留，无需动）：
- 第 138 行：`<p>{coach.title}</p>` — 删除整行
- 第 199–211 行：`{coach.education && (...)}` 整块 — 删除

**不动**：
- 数据库列保留（防止历史数据丢失，未来如需复活可直接打开 UI）
- `useHumanCoaches.ts` 的 select 字段保留（避免 types 联动改动扩大）
- 申请自助表（BasicInfoStep）本来就没有这些字段，无需再清理

---

### 改动文件清单

- 新增 `src/components/coach-application/MyApplicationsCard.tsx`
- 编辑 `src/pages/BecomeCoach.tsx` — 顶部挂载卡片；`loadExisting` 支持 `?edit=<id>` 优先
- 编辑 `src/pages/HumanCoachDetail.tsx` — 删除 `title` + `education` 渲染块

### 验收

1. 用户 A 代申请教练 X → 顶部出现 X 的记录，状态「待审核」，可继续编辑
2. 管理员驳回 X → A 返回 BecomeCoach，看到「已拒绝」+ 原因，可点编辑修改并自动回到 pending
3. X 审核通过 → 列表显示「已通过」，无编辑按钮
4. 打开任意已通过教练详情页 → 不再显示 title（如"高级心理咨询师"小字行）和教育背景卡片
