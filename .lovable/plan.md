

## 问题分析

当前告警通知的触发方式存在根本性问题：

1. **风险内容告警**：`useEmergencyAlert` 是前端 React Hook，只在管理员打开 `RiskContentMonitor` 组件时，通过 `useEffect` 遍历数据库记录来触发通知。如果没有管理员打开页面，通知永远不会发送。

2. **成本告警**：`check-cost-alerts` 是后端函数，已支持 cron 调用，但**未配置 cron 定时任务**。

3. **`scan-risk-content`**：后端函数已能实时检测风险内容并写入数据库，但写入后**没有触发企业微信通知**。

**核心问题**：告警推送逻辑放在了前端（需要管理员在线），而不是后端（自动执行）。

---

## 实施计划

### 1. 修改 `scan-risk-content` 边缘函数 — 检测到风险后直接推送企业微信通知

在风险记录成功插入 `monitor_risk_content` 后，增加服务端逻辑：
- 查询 `emergency_contacts` 表中匹配 `risk_content` 来源且匹配对应级别的联系人
- 调用 `send-emergency-alert` 函数推送企业微信通知
- 只对 `critical` 和 `high` 级别风险自动推送

这样每次 AI 对话或社区内容触发风险检测时，**实时**推送通知，无需管理员在线。

### 2. 为 `check-cost-alerts` 添加 cron 定时任务

- 添加每 30 分钟执行一次的 cron 任务
- 并在 `check-cost-alerts` 函数中，将现有的 `send-wecom-notification`（不存在的函数）替换为 `send-emergency-alert`

### 3. 创建 `check-monitor-alerts` 边缘函数 — 统一巡检

新建一个定时巡检函数，每 15 分钟执行，检查：
- API 错误率突增（`monitor_api_errors` 表，最近 15 分钟错误数 > 阈值）
- 前端错误突增（`monitor_frontend_errors` 表）
- 未处理的高危风险内容（`monitor_risk_content` 表中 `status = 'pending'` 且 `risk_level in ('critical','high')`）

触发条件满足时，调用 `send-emergency-alert` 推送通知。配合 cron 任务自动执行。

### 4. 注册 cron 定时任务

通过 SQL 注册两个新 cron job：
- `check-cost-alerts`：每 30 分钟
- `check-monitor-alerts`：每 15 分钟

### 5. 前端告警逻辑保留但降级

`RiskContentMonitor` 中的 `useEmergencyAlert` useEffect 保留作为**补充**（管理员在线时的即时反馈），但主要告警职责由后端承担。

---

## 技术细节

**修改文件：**
- `supabase/functions/scan-risk-content/index.ts` — 插入记录后增加通知推送
- `supabase/functions/check-cost-alerts/index.ts` — 修复通知调用（`send-wecom-notification` → `send-emergency-alert`）
- 新建 `supabase/functions/check-monitor-alerts/index.ts` — 统一巡检函数
- SQL：注册 2 个 cron job

