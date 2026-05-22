
# 教练申请流程 · 最终实施方案（已并入 P0/P1/P2 加固）

## 一、数据库改动

### 1.1 `human_coaches` 表
- 新增 `submitted_by_user_id uuid`（代申请提交者，所有路径必填）
- 新增 `claim_phone text` + `claim_country_code text default '+86'`（代申请锚定手机号）
- 新增 `proxy_verified_at timestamptz`（代申请的教练本人短信验证通过时间，P0-3）
- 新增 `experience_years_bucket text` check in ('lt3','3to5','5to10','gte10')（P0-1 经验区间）
- 新增 `preferred_tier_id uuid references coach_price_tiers`（申请者期望档位，可空）
- 新增 `preferred_tier_reason text`（一句话理由，可空）
- 新增 `suggested_tier_id uuid references coach_price_tiers`（系统按经验+持证算出的推荐档位）
- `user_id` 改为 nullable
- 旧的 `unique(user_id)` 改为 `unique(user_id) where user_id is not null`

### 1.2 唯一约束 & 防滥用
- `unique (claim_phone, claim_country_code) where user_id is null and status in ('pending','approved')` —— 防 P0-3 撞号
- 触发器：同一 `submitted_by_user_id` 24h pending ≤ 5、累积 pending ≤ 10，超额抛错（P1-2）

### 1.3 RLS
- SELECT/UPDATE：`submitted_by_user_id = auth.uid()` OR `user_id = auth.uid()` OR admin
- INSERT：必须 `submitted_by_user_id = auth.uid()`
- `coach_price_tiers` SELECT：仅 `auth.uid() is not null`（P2-1，禁匿名爬取）

### 1.4 复用现有 SMS 通道
- `send-sms-code` / `verify-sms-code` 复用阿里云短信，新增 `purpose='coach_proxy_verify'`
- 验证通过后由 edge function 写入 `human_coaches.proxy_verified_at`

### 1.5 一次性审核通过 RPC（P2-2 事务化）
- `approve_coach_application(coach_id, certification_ids[])`：
  - 校验所有 `certification_ids` 属于该 coach 且调用者为 admin
  - update `human_coaches` set status='approved', is_accepting_new=true, is_verified=true, verified_at=now()
  - update 这些 `coach_certifications` set verification_status='verified', verified_by=auth.uid()
  - 插入 `coach_services`（依赖 `apply_tier_price_on_service_insert` 触发器自动填价）
  - 任一失败回滚

### 1.6 自动认领冲突保护（P2-3）
- 用户注册时若 `claim_phone` 匹配且本人已存在 active 教练记录 → 不静默 bind，写入 `coach_claim_conflicts` 表待用户在前端二选一

---

## 二、前端改动

### 2.1 `/become-coach?invite=xxx` 改造为「入口 + 列表」
- 顶部列出当前用户作为 `submitted_by_user_id` 或 `user_id` 的所有 `human_coaches`，带状态徽章（pending / approved / rejected）+ 「编辑」按钮
- 两个 CTA：「➕ 我要申请」（self）、「➕ 帮他人申请」（proxy）

### 2.2 `CoachApplicationForm` 三种模式
- `mode: 'self' | 'proxy' | 'edit'`
- **Step 1 基础信息**：头像 / 姓名 / 手机号 / bio
  - proxy 模式：手机号填教练本人号 → 触发"获取验证码"按钮 → 教练本人收到 6 位码 → 代理人输入 → 校验通过后才能进入 Step 2
- **Step 2 资质上传**：现有 `CertificationsStep` 不变
- **Step 3 经验 & 期望档位（P0-1）**：
  - 必选：从业年限区间 radio（4 选 1）
  - 系统按规则即时显示推荐档位卡片（10+ & 持证 → 金牌，5-10 → 高级，3-5 → 认证，<3 → 新锐）
  - 可选：期望档位 radio + 一句话理由 textarea
- 编辑模式分两类提交按钮（P1-1）：
  - **快速更新**（头像/bio/擅长/年限）→ 直接生效不下架
  - **重新提审**（姓名/手机号/资质增减/期望档位变更）→ status=pending, is_accepting_new=false, is_verified=false

### 2.3 死字段处理（P1-3）
- 前端表单/管理后台 UI 全部隐藏 `title/education/training_background/intro_video_url/case_studies`
- DB 列保留不删除，便于未来恢复

---

## 三、管理后台改动

### 3.1 `CoachApplicationDetail.tsx` 审核页
- 顶部信息卡：申请者姓名/手机号 + 提交方式标签（自申请 / 代申请，代申请显示代理人）
- 经验 & 档位卡片：
  - 申请者年限区间
  - 系统推荐档位（高亮，默认选中）
  - 申请者期望档位 + 理由（如果有，灰色对比展示）
  - 一个 radio 让管理员一键确认（默认就是推荐档位，零思考通过）
- 资质审阅区（P0-2）：
  - 每张证书一个 Checkbox「✓ 已审阅」（默认未勾）
  - 「通过」按钮 disabled，直到全部勾选才可点
- 「通过」按钮 → 调用 1.5 的 RPC，一次完成 status + verification + service 创建
- 「拒绝」按钮 → 弹窗必填 `rejected_reason`

### 3.2 `CoachApplicationsList.tsx`
- 列表增加「提交方式」「期望档位」「推荐档位」三列，便于批量分流

---

## 四、删除/废弃
- `ServicesStep.tsx`（dead code）
- 旧的 `updateStatusMutation` 中分散的 verify 步骤 → 改用 1.5 的 RPC

---

## 五、验证路径

1. **自申请**：登录 → /become-coach?invite=xxx → 我要申请 → 填 3 步 → 提交 → 列表出现 pending
2. **代申请**：同一账号 → 帮他人申请 → 填教练手机号 → 验证码（短信到教练本人）→ 输入→ 校验通过 → 填资质/经验 → 提交 → 列表出现 pending（user_id=null, claim_phone=教练号）
3. **审核**：admin 进详情 → 看到推荐档位（已选）→ 勾选所有证书 → 通过 → 教练立即上线、可接单、价格已同步
4. **编辑通过的教练**：教练本人进入 → 快速改头像 → 仍在线；改资质 → 自动转 pending 重审
5. **撞号防护**：同号代申请第二次 → DB 抛唯一约束错误，前端提示「该手机号已有未完成申请」
6. **教练注册认领**：教练用 claim_phone 注册 → 若该号已 proxy_verified → 自动 bind user_id；若已有 active 教练记录 → 弹合并选择

---

## 六、待用户确认（实施前最后一关）

- 推荐档位规则是否就用：`10+&持证→金牌 / 5-10→高级 / 3-5→认证 / <3→新锐`？或你想自定义阈值？
- 代申请短信验证码可以走现有阿里云 SMS 通道（已配置），无新增成本，确认即可开工。
