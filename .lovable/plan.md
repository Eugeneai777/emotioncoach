# 告警统一改为 15 分钟自动巡检

目标：后台管理页面里「打开页面才触发」的企业微信告警全部取消，改为服务端每 15 分钟自动检查，发现异常自动推送。管理员不在电脑前也能收到通知。

## 现状

- 4 个后台面板（调用监控、成本监控、用户异常、稳定性监控）在管理员打开页面、数据加载完成时才判断阈值并推送告警。没人打开后台就永远不会发。
- 服务端已有的定时巡检：
  - 调用/稳定性/风险内容检查：每 15 分钟
  - 用户异常检查：每 15 分钟
  - 成本预警检查：每 30 分钟
  - OG 分享健康检查：每 15 分钟

## 改动内容

1. **移除页面实时触发**
   去掉 4 个后台面板中的告警推送调用（调用监控、成本监控、用户异常、稳定性监控），面板只保留展示和手动「立即检查」按钮，不再自作主张发消息。

2. **成本巡检提速到 15 分钟**
   把成本预警的定时任务从每 30 分钟改为每 15 分钟，与其他巡检节奏一致。

3. **补齐服务端判定条件**
   把页面里原有但服务端缺失的判定补进定时巡检，保证告警覆盖不缩水：
   - 用户异常：出现 critical 异常 → critical；15 分钟内待处理异常累计 ≥ 5 条 → high。
   - 稳定性：按数据库中的错误记录计算近 15 分钟成功率，低于 90% 发 critical，低于 95% 发 high。

4. **服务端去重**
   同一「来源 + 告警类型」15 分钟内只发一次，依据 `emergency_alert_logs` 最近成功记录判断，避免连续巡检重复轰炸。

5. **统一告警日志字段**
   用户异常巡检写日志时字段与其他巡检对齐（`alert_source` / `send_status`），保证后台告警记录页能完整显示。

## 技术细节

- 前端：删除 `OperationsMonitorDashboard.tsx`、`CostMonitorDashboard.tsx`、`UserAnomalyMonitor.tsx`、`StabilityMonitor.tsx` 中的 `triggerEmergencyAlert` 调用及相关 `useRef` 标记；`src/lib/emergencyAlertService.ts` 保留（告警日志查询仍在用）。
- 边缘函数：在 `_shared` 增加一个基于 `emergency_alert_logs` 的冷却判定 + 联系人匹配发送的公共函数，`check-monitor-alerts`、`check-user-anomaly-alerts`、`check-og-health-alerts`、`check-cost-alerts` 统一复用。
- cron：`cron.unschedule('check-cost-alerts-every-30min')` 后重建为 `*/15 * * * *`。
- 巡检频率说明：4 个巡检任务各每天运行 96 次（15 分钟一次）。这是告警时效性与数据库常驻开销的折中——延长间隔会降低成本但异常最长延迟会拉长到该间隔。
