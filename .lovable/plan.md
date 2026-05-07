## 目标
在「管理后台 → 测评管理 → 数据洞察 → 测评者名单」中，给每位测评者添加**仅管理员可见**的备注，不暴露给用户前端。

## 一、数据库
新建 `admin_user_notes` 表（管理员私有备注，按 user_id 唯一）：
- `user_id` (uuid, unique) — 被备注的用户
- `note` (text) — 备注内容
- `tags` (text[]) — 可选标签（如 "高意向"/"已加微信"/"已删除"）
- `created_by` (uuid) — 写入备注的管理员
- `updated_by` (uuid)
- `created_at` / `updated_at`

RLS：仅 `has_role(auth.uid(), 'admin')` 可 SELECT / INSERT / UPDATE / DELETE。**不开放给普通用户**，确保用户前端无法读取。

## 二、Hook 层
1. `useAdminAssessmentInsights.ts`：批量查 `admin_user_notes`（按 `userIds in`），合并到 `RespondentRow`，新增 `adminNote` / `adminTags` 字段。
2. 新增 `useAdminUserNote.ts`：提供 `upsertNote(userId, note, tags)`、自动 `invalidateQueries('admin-assessment-insights')`。

## 三、UI
1. **名单表格** (`AssessmentInsightsDetail.tsx`)：
   - 在「用户」列下方加一行小字显示备注摘要（≤20字截断）+ tag chips；无备注则显示灰色「+ 备注」按钮。
2. **明细抽屉** (`AssessmentRespondentDrawer.tsx`)：
   - 顶部新增「管理员备注」卡片：Textarea + 标签输入 + 保存按钮 + 「最后由 xxx 于 yyy 更新」。
   - 保存后 toast 提示，并刷新名单。
3. 名单 CSV 导出新增「备注」「标签」两列。

## 四、安全
- 仅在管理后台路由 (`/admin/...`) 下渲染，备注表 RLS 强制管理员；用户前端任何 hook 都不会引用此表。
- 在 mem://index.md Core 中已有 RLS 规范，无需新增。

## 技术细节
```text
admin_user_notes
  ├── PK id
  ├── UNIQUE(user_id)         -- 一个用户一条备注
  └── RLS: admin only (4 policies)

UI 流程：
名单行 ──点击备注──▶ 抽屉 Textarea ──保存──▶ upsert ──▶ refetch
```

## 范围外
- 不新增「按备注/标签筛选」（如需要可二期）
- 不做备注修改历史日志（仅保留最后一次）
