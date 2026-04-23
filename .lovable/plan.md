
## 充值成功但前端长期停在“充值中”且可能重复赠送 — 修复方案

### 目标
把“管理员赠送点数”改成：
1. 用户点击后立即有明确反馈；
2. 网络慢/响应丢失时不会误以为失败；
3. 重复点击、超时后重试、刷新后再次操作都不会重复赠送；
4. 最终一定能给出“成功 / 失败 / 处理中”的明确结果。

### 已确认的现状问题
- `src/components/admin/RechargeDialog.tsx` 里前端直接 `await functions.invoke('admin-recharge')`，没有超时后的“结果核实”机制。
- 成功提示 `toast.success(...)` 只在前端拿到正常响应后才会出现；如果后端已执行成功但前端请求挂住/响应丢失，界面会一直停在“充值中...”。
- `supabase/functions/admin-recharge/index.ts` 当前没有“幂等请求标识”，所以用户以为没成功而再次点击时，后端会再次加点，存在重复赠送风险。
- 当前只把管理员充值写进 `subscriptions`，但没有独立的“充值请求状态”记录，前端超时后无法核实这一次操作到底有没有生效。

### 实施方案

#### 1) 后端增加“充值请求幂等”与状态落库
新增一个专门的充值请求表，例如：
- `admin_quota_recharges`
- 核心字段：
  - `id`
  - `request_id`（唯一）
  - `admin_user_id`
  - `target_user_id`
  - `quantity`
  - `package_type`
  - `notes`
  - `expiry_days`
  - `status`（`processing` / `applied` / `failed`）
  - `before_total_quota`
  - `after_total_quota`
  - `remaining_quota_after`
  - `error_message`
  - `created_at` / `updated_at` / `applied_at`

数据库侧加唯一约束：
- `unique(request_id)`

这样同一个 `request_id` 无论前端发几次，都只能成功赠送一次。

#### 2) 用数据库函数保证“只加一次”
新增一个数据库函数（由边缘函数调用）统一处理充值：
- 校验参数合法性
- 按 `request_id` 查找/创建充值请求
- 对目标 `user_accounts` 行加锁
- 若该请求已 `applied`，直接返回已有结果，不再重复加点
- 若未执行过，则更新 `user_accounts.total_quota`
- 写入 `subscriptions` 审计记录
- 回填 `admin_quota_recharges` 为 `applied`
- 返回最新额度结果

这样可以把“更新额度 + 记录审计 + 幂等判断”放在一个原子流程里，避免前端重复点击造成多次赠送。

#### 3) 边缘函数改为“请求创建 / 状态查询”双模式
更新 `supabase/functions/admin-recharge/index.ts`：
- `action: 'apply'`
  - 接收 `requestId`
  - 调用数据库函数执行幂等充值
  - 返回：
    - `success`
    - `requestId`
    - `status`
    - `alreadyProcessed`
    - `newTotalQuota`
    - `newRemainingQuota`
- `action: 'status'`
  - 按 `requestId` 查询 `admin_quota_recharges`
  - 返回该请求当前状态与结果

同时补齐：
- 更严格的参数校验
- 更清晰的日志
- CORS headers 完整返回
- 错误统一返回 JSON，方便前端提取中文错误

#### 4) 前端改成“先生成 requestId，再提交”
更新 `src/components/admin/RechargeDialog.tsx`：
- 点击“确认充值”时先生成唯一 `requestId`
- 把本次请求信息暂存到 `sessionStorage`（按用户维度保存）
- 立即显示“正在提交充值，请勿重复点击”
- 调用 `admin-recharge` 的 `apply`

如果：
- 正常返回成功：立刻 toast 成功，刷新列表，清掉 pending request
- 发生超时 / 网络异常：不要直接提示“失败”，而是进入“结果核实”流程

#### 5) 前端加入“超时后自动核实结果”
如果 `apply` 超时或网络中断：
- 前端自动改为调用 `action: 'status'` 查询刚才那个 `requestId`
- 若查到 `applied`：立即提示“充值已成功到账”，并刷新用户列表
- 若查到 `processing`：提示“后台仍在处理中，请勿重复点击”，继续轮询数秒
- 若查到 `failed`：显示失败原因，并解除按钮锁定
- 若短时间查不到结果：提示“正在核实，请稍后刷新查看”，但保留同一个 `requestId`，避免用户再次发起新充值

这样即使第一次请求响应丢了，也不会让管理员误判为失败然后重复赠送。

#### 6) UI 上明确阻止重复操作
`RechargeDialog` 里增加以下体验优化：
- loading 时禁用关闭/重复提交
- 按钮文案分阶段显示：
  - `提交中...`
  - `核实结果中...`
- 显示一行说明：
  - “若网络较慢，请勿重复点击；系统会自动核实是否已充值成功”
- 成功后弹窗自动关闭
- 失败后按钮恢复可点

#### 7) 错误提示统一中文化
前端接入 `src/lib/edgeFunctionError.ts` 的 `extractEdgeFunctionError(...)`：
- 避免只看到 SDK 的英文通用报错
- 管理员能明确看到是认证失败、权限不足、参数错误，还是后台处理中

### 涉及文件
1. `src/components/admin/RechargeDialog.tsx`
   - 增加 `requestId`
   - 增加超时 + 状态核实 + pending request 恢复
   - 优化 toast 与按钮状态
2. `supabase/functions/admin-recharge/index.ts`
   - 支持 `apply/status`
   - 接入幂等逻辑
   - 完善日志、CORS、参数校验、返回结构
3. 新增数据库 migration
   - 创建 `admin_quota_recharges`
   - 唯一约束 `request_id`
   - 必要索引
   - 数据库函数（幂等充值执行）
   - 开启 RLS，并仅允许 admin 查询；写操作仅通过后端函数完成

### 技术细节
- `admin_user_id` / `target_user_id` 存 UUID，不直接外键到认证系统用户表
- `request_id` 由前端生成并随整次充值流程复用
- 幂等判断必须以后端唯一约束和状态表为准，不能只靠前端 `loading`
- `subscriptions` 继续保留，作为业务审计展示来源；`admin_quota_recharges` 负责请求状态与防重复
- 前端超时不等于失败；只有查到 `failed` 或明确错误才允许重新发起新的 `requestId`

### 验收标准
1. 点击“确认充值”后，立刻出现“处理中”提示，不再只有静默 loading
2. 后端实际充值成功时，即使第一次响应丢失，前端也能通过状态核实最终提示“充值成功”
3. 在网络慢、连续点击、刷新后重试等场景下，同一笔充值最多只会生效一次
4. 用户管理列表刷新后能看到最新额度
5. 管理员在用户详情/审计记录中能追溯本次赠送
6. 不再出现“实际已到账，但前端长期不提示成功，导致重复赠送”的情况
