

# 告警推送增加错误详情

## 问题
当前 `check-monitor-alerts` 边缘函数在 API 错误和前端错误告警中只推送错误数量，不包含具体哪些接口/页面出了什么错误，无法快速定位问题。

## 方案

修改 `supabase/functions/check-monitor-alerts/index.ts`，在触发告警前查询最近的错误记录详情，拼接到 `details` 字段中。

### 1. API 错误告警增加详情

当 `apiErrorCount > 10` 时，额外查询 `monitor_api_errors` 表最近 10 条记录，提取 `error_type`、`url`、`message`、`status_code`，按 `url + error_type` 聚合统计，生成类似：

```
错误分布（Top 5）:
- POST /functions/v1/doubao-realtime-relay [server_error] x3: WebSocket连接失败
- GET /rest/v1/profiles [timeout] x2: 请求超时
- POST /functions/v1/log-api-cost [client_error] x1: Missing authorization header
```

### 2. 前端错误告警增加详情

当 `feErrorCount > 15` 时，同样查询 `monitor_frontend_errors` 最近记录，按 `error_message + page` 聚合，展示 Top 5 错误类型和出现页面。

### 技术细节

- 仅修改 `supabase/functions/check-monitor-alerts/index.ts`
- 在已有的 count 查询之后，增加一个 `select` 查询获取详情（limit 50），在内存中聚合
- 不影响告警触发逻辑，只丰富 `details` 内容
- 部署后自动生效

