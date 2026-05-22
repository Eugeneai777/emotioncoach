## 剩余实施计划（基于已落地的数据库 + 自助申请流程）

默认采纳前次提问的方案：
- **推荐档位规则**：`10+年 且 有证书 → 金牌` / `5-10年 → 高级` / `3-5年 → 认证` / `<3年 → 新锐`
- **代申请验证**：走现有阿里云 SMS（`send-sms-code` / `verify-sms-code`），新增 `purpose='coach_proxy_verify'`

---

### 一、管理员审核 UI（P0-2 落地）

**文件**：`src/pages/admin/CoachApplicationDetail.tsx`（新建 / 改造现有审核详情页）

- 顶部信息卡：申请人姓名、手机、提交方式（自助 / 代申请）、提交时间、经验区间
- **档位三列对照**：
  - 申请人期望档位（灰色标签 + 期望理由）
  - 系统推荐档位（高亮主色，基于经验+证书自动算）
  - 管理员最终档位（4 个 RadioCard，默认选中"系统推荐"）
- **证书审阅清单**：每张证书一行（缩略图 + 类型 + 编号 + 发证机构），右侧 `Checkbox "✓ 已审阅"`
- **底部操作**：
  - "通过审核" 按钮 `disabled` 直到 **所有证书均勾选 + 选定最终档位**，点击调 `approve_coach_application(coach_id, cert_ids[], final_tier_id)` RPC
  - "拒绝" 弹窗强制输入拒绝原因，调 `reject_coach_application`
- 通过 / 拒绝后 toast 提示 + 刷新列表

**文件**：`src/pages/admin/CoachApplicationsList.tsx`（已存在则微调）

- 新增列：`提交方式`（自助/代申请 badge）/ `经验`（bucket）/ `期望档位` / `推荐档位`
- 筛选器：状态（pending/approved/rejected）+ 提交方式

---

### 二、代申请流程（P0-3 落地）

**入口**：`/become-coach?invite=xxx&mode=proxy` 或在 `/become-coach` 列表页提供"代他人申请"按钮

**文件**：`src/components/coach-application/ProxyVerifyStep.tsx`（新建，作为代申请 Step 0）

- 字段：教练姓名、教练手机号 + 区号、备注（代理人和教练关系）
- 点击"发送验证码" → 调 `send-sms-code` Edge Function（`purpose='coach_proxy_verify'`）
- 教练手机收码 → 代理人填入 → 调 `verify-sms-code` 校验
- 校验成功：本地存 `proxy_verified_at = now()`，进入 Step 1-4（沿用自助流程的表单组件，但禁用"我是教练本人"相关字段）

**文件**：`src/pages/BecomeCoach.tsx`（已改造，增加 mode 分支）

- `mode='proxy'`：前置 ProxyVerifyStep，提交时写入 `submitted_by_user_id = auth.uid()` + `claim_phone/claim_country_code = 教练手机` + `proxy_verified_at`
- `mode='self'`：保持现状
- `mode='edit'`：复用表单，根据敏感字段差异决定是否回到 pending（仅前端预判，后端 RLS 已限制）

**文件**：`supabase/functions/send-sms-code/index.ts` & `verify-sms-code/index.ts`

- 在 `purpose` 枚举白名单加入 `coach_proxy_verify`（其他逻辑不变）

---

### 三、申请人入口 / 我的申请列表

**文件**：`src/pages/BecomeCoach.tsx` 头部新增"我的申请"区块

- 列出当前用户作为 `submitted_by_user_id` 提交的所有 `human_coaches`
- 每行：教练姓名 + 状态 badge（pending/approved/rejected）+ 拒绝原因（若有）+ "编辑" 按钮（仅 rejected/pending 可编辑）
- 编辑跳到 `mode='edit'` 表单，编辑敏感字段后提交 → 自动回到 pending、`is_accepting_new=false`

---

### 四、死字段下架（P1-3）

仅前端隐藏，DB 列保留：

- `BecomeCoach.tsx` 及子组件移除 `title / education / training_background / intro_video_url / case_studies` 的输入控件
- 教练详情公开页（`CoachProfile.tsx` 等）移除这些字段的展示

---

### 五、验收用例

| 用例 | 期望结果 |
|---|---|
| 自助申请，3 张证书，管理员只勾选 2 张点通过 | 按钮 disabled，无法通过 |
| 代申请，未填验证码直接提交 | 表单拦截 + 后端 RLS 拒绝（无 proxy_verified_at） |
| 24 小时内同一用户提交第 6 份申请 | 数据库 trigger 抛 `coach_application_throttle_24h`，前端 toast |
| 通过审核后 | 教练立即出现在前端列表，`is_verified=true`、默认 60min 服务已建 |
| 编辑已通过教练的姓名 | 自动回到 pending，前端列表立即下架 |

---

完成后请确认是否点击 "Implement plan"，我将按一、二、三、四顺序执行。