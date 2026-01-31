

# 修复「死了吗」功能紧急联系人通知问题

## 问题诊断

用户已经 **8 天没有打卡**（最后打卡：2026-01-23），但紧急联系人 `jennyc127@yahoo.com` 从未收到通知。

### 根本原因

| 问题 | 说明 |
|------|------|
| 函数未配置 | `batch-check-alive-status` 未在 `supabase/config.toml` 中声明 |
| 函数未部署 | Edge Function 日志中无任何该函数的执行记录 |
| 无定时任务 | 没有 Cron Job 每日自动触发批量检查 |

---

## 修复方案

### 步骤 1：在 config.toml 中添加函数配置

**修改文件**：`supabase/config.toml`

```toml
[functions.batch-check-alive-status]
verify_jwt = false

[functions.send-alive-check-alert]
verify_jwt = false
```

这两个函数都需要 `verify_jwt = false`，因为：
- `batch-check-alive-status` 由定时任务调用，使用 `CRON_SECRET` 验证
- `send-alive-check-alert` 由 batch 函数内部调用，使用 service role key 验证

### 步骤 2：添加 CRON_SECRET 密钥

需要配置 `CRON_SECRET` 环境变量，用于验证定时任务调用的合法性。

### 步骤 3：设置定时任务

在后端配置中添加每日定时任务，建议每天早上 9:00 CST (UTC+8 即 01:00 UTC) 运行：

```
URL: https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/batch-check-alive-status
Method: POST
Headers: 
  - Authorization: Bearer ${CRON_SECRET}
Schedule: 0 1 * * * (每天 UTC 01:00，即北京时间 09:00)
```

### 步骤 4：手动触发一次测试

部署完成后，手动调用函数验证功能正常：

```bash
curl -X POST \
  https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/batch-check-alive-status \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
```

---

## 技术细节

### 通知逻辑流程

```text
定时任务 (每日 09:00)
    │
    ▼
batch-check-alive-status
    │
    ├─ 查询所有 is_enabled=true 且有紧急联系人的用户
    │
    ├─ 对每个用户：
    │   ├─ 获取最后打卡时间
    │   ├─ 计算间隔天数
    │   ├─ 如果超过 days_threshold：
    │   │   ├─ 检查 last_notification_at (24小时内不重复发送)
    │   │   └─ 调用 send-alive-check-alert 发送邮件
    │   └─ 更新 last_notification_at
    │
    └─ 返回处理结果
```

### 防重复机制

函数已内置 24 小时防重复发送逻辑（见 batch-check-alive-status 第 86-94 行），确保不会频繁骚扰紧急联系人。

---

## 需要的操作

| 步骤 | 操作 | 负责方 |
|------|------|--------|
| 1 | 添加 config.toml 配置 | Lovable |
| 2 | 配置 CRON_SECRET 密钥 | 用户（在 Secrets 中添加） |
| 3 | 设置外部定时任务服务 | 用户（如 cron-job.org、EasyCron 等） |
| 4 | 手动触发测试 | 用户验证 |

---

## 影响范围

- 修改 1 个配置文件：`supabase/config.toml`
- 需要用户配置外部定时任务服务
- 修复后所有启用此功能的用户都将正常收到通知

