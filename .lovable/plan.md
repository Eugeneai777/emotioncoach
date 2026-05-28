## 问题核实

1. **`/admin/human-coaches` 这条链接根本不存在**。`src/App.tsx` 只注册了 `/human-coaches`（公开列表）与 `/human-coaches/:id`，没有 `/admin/human-coaches` 路由。所以截图里看到的其实是 `/human-coaches`（公开教练列表页）—— 这是被 404 兜底或用户手输入跳转过去的结果。

2. **代申请（proxy）入口确实"消失"了**：
   - `BecomeCoach.tsx` 本身支持 `?mode=proxy` 进入代申请流程（含 `ProxyVerifyStep` 身份核验 + 已提交记录卡片 `MyApplicationsCard`），逻辑完好。
   - 但 **没有任何一个页面提供按钮把用户带到 `?mode=proxy`**：
     - `/human-coaches`（公开教练列表）只在已认证教练登录后显示"我的后台"按钮，没有"成为教练 / 代他人申请"按钮。
     - `/coach-recruitment` 招募页的两个 CTA 都是 `navigate("/become-coach")`，固定为 self 模式。
     - `/become-coach` 自身只有在 URL 已经带 `?mode=proxy` 时才显示代申请流程；自助模式下也没有"为他人申请"的切换按钮。
   - 结果：已成为教练的用户、或想替朋友/学员申请的用户，在 UI 上找不到任何入口。

## 修复方案（仅前端）

### 1. `/human-coaches` 公开列表页（`src/pages/HumanCoaches.tsx`）
在 `PageHeader.rightActions` 里追加一个 **"申请入驻"** 按钮（与已存在的"我的后台"并列）：
- 未登录或未成为教练的用户：显示 `申请入驻` → 跳 `/coach-recruitment`
- 已是教练的用户（`coachProfile` 存在）：在"我的后台"旁补一个 `代他人申请` 小按钮 → 跳 `/become-coach?mode=proxy`

### 2. `/coach-recruitment` 招募页（`src/pages/CoachRecruitment.tsx`）
在 Hero 区和底部 CTA 区，除了"立即申请入驻"主按钮外，**加一个次级链接** `我要替他人申请 →` → `navigate("/become-coach?mode=proxy")`。

### 3. `/become-coach` 自助申请页（`src/pages/BecomeCoach.tsx`）
当 `mode === "self"` 且当前用户未提交过自助申请时，在顶部已有的"当前以 xxx 身份…"提示框下方再加一条小提示：
> 不是为自己申请？[切换为代他人申请 →]

点击切换到 `?mode=proxy`（保留 `invite` token）。

### 4. （可选小修）`/admin/human-coaches` 路由兜底
为了避免外部链接 404，在 `App.tsx` 中加一条重定向：`/admin/human-coaches` → `/human-coaches`。

## 不在本次范围
- 不动数据库 / RLS / Edge function
- 不改 `BecomeCoach` 的代申请业务逻辑、`ProxyVerifyStep`、`MyApplicationsCard`（这些都正常）
- 不改 admin 管理页（`/admin` 下的 `HumanCoachesManagement` 是后台审核工具，与代申请入口无关）

## 验收
- 公开列表页 `/human-coaches` 右上角能看到"申请入驻"或"代他人申请"按钮。
- 点击后能正常进入 `/become-coach?mode=proxy`，看到"身份核验"步骤。
- 已提交过的代申请记录在 `MyApplicationsCard` 中正常展开 / 编辑。
