

## 实施提醒方案：已购买但未完成财富卡点测评

### 变更清单

**1. 新建 Edge Function: `supabase/functions/batch-trigger-assessment-reminder/index.ts`**

参照 `batch-trigger-profile-completion` 的模式：

- 使用 `validateCronSecret` 鉴权
- 用 service_role 查询"已购买测评但未完成"的用户：
  - 从 `orders` 表找 `package_key='wealth_block_assessment'` 且 `status='paid'` 的用户
  - 排除 `wealth_block_assessments` 表中已有记录的用户
- 3 天去重窗口：检查 `smart_notifications` 中 `scenario='assessment_incomplete_reminder'` 是否已在 3 天内发送过
- 调用 `generate-smart-notification` 生成个性化通知：
  - scenario: `assessment_incomplete_reminder`
  - context 包含购买时间等信息
  - coach_type: `wealth`

**2. 修改 `src/components/SmartHomeRedirect.tsx`**

在 wealth 用户分支中增加即时提醒逻辑：

- 当 `hasPaidAssessment = true` 时，额外查询 `wealth_block_assessments` 表
- 如果没有完成记录，通过 localStorage 日级去重后，调用 `generate-smart-notification` 触发即时通知
- 不影响现有的路由跳转逻辑

**3. 更新 `supabase/config.toml`**

添加新函数配置：
```toml
[functions.batch-trigger-assessment-reminder]
verify_jwt = false
```

### 通知内容

| 字段 | 值 |
|---|---|
| scenario | `assessment_incomplete_reminder` |
| notification_type | `reminder` |
| 标题方向 | "你的财富卡点测评还在等你" |
| action_type | `navigate` |
| action_data | `{"path": "/wealth-block"}` |
| coach_type | `wealth` |
| priority | 4 |

### Cron 调度

需要通过 SQL 设置每天上午 10:00 (北京时间 = UTC 02:00) 执行一次：

```sql
SELECT cron.schedule(
  'batch-assessment-reminder-daily',
  '0 2 * * *',
  $$ SELECT net.http_post(...) $$
);
```

