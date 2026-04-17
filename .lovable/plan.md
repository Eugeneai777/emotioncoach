
用户报告：账号 15228901521 购买了「标准会员」(¥0.01 测试价，应充 300 点)，但 300 点没到账。需要排查充值未到账的原因。

## 排查计划

### 1. 查询用户与订单数据
- 通过手机号 15228901521 找到 user_id（profiles 表）
- 查 orders 表：该用户最近的 standard_49 订单，状态、支付时间、quota_added 字段
- 查 user_quotas / ai_usage_quotas 表：当前余额、最近变动
- 查 quota_transactions（如有）：是否有 +300 的充值流水

### 2. 检查 standard_49 / premium_99 履约逻辑
昨天刚新增的 standard_49 / premium_99 套餐，需要确认 self-healing / wechat-pay-callback / check-order-status 边缘函数中是否有处理这两个 package_key 的逻辑分支。如果履约函数里硬编码了 "basic" / "member365" 的 if-else，新 key 会被跳过——这极可能是根因。

### 3. 检查支付回调日志
- function_edge_logs：wechat-pay-callback / check-order-status 在该订单时间附近的执行记录
- edge_function_logs：是否有报错或跳过该订单

### 4. 修复方案（待排查后确认）
**预期根因 A**：履约函数缺少 standard_49 / premium_99 的点数发放分支
- 修复：扩展履约 edge function，使用 packages 表的 ai_quota 字段动态发放，而不是硬编码 if-else
- 数据补偿：手动给 15228901521 补 300 点，并写入流水

**预期根因 B**：订单状态未更新到 paid（支付回调失败）
- 修复：手动触发 check-order-status；排查回调失败原因

**预期根因 C**：订单已 paid 且发放成功，但 UI 未刷新
- 修复：前端刷新逻辑

## 执行步骤（批准后）
1. SQL 查询定位订单与配额状态（read_query）
2. 查 edge function 日志确认回调执行情况
3. 阅读 wechat-pay-callback / check-order-status / 相关 self-healing 函数源码，确认 standard_49 处理逻辑
4. 根据根因执行：补点数 + 修复履约函数（如需）
5. 验证：再次测试 ¥0.01 购买 premium_99，确认 800 点正常到账

## 涉及文件预估
- `supabase/functions/wechat-pay-callback/index.ts`（履约逻辑）
- `supabase/functions/check-order-status/index.ts`（轮询补单）
- 可能涉及 `supabase/functions/alipay-callback/*` 等
- 数据补偿 SQL（INSERT 配额流水 + UPDATE 余额）

约 1-2 个 edge function 修改 + 1 条补偿 SQL。
