

# 问题确认：模型名修正未生效

## 根因

截图中 `73f3776b...` 这条记录就在数据库里 — **今天** 仍在持续写入 `gpt-4o-realtime-preview-2024-12-17`（今日已有 5+ 条）。这说明：

1. **前端代码未发布**：`CoachVoiceChat.tsx` 第 609 行虽然改成了 `gpt-4o-mini-realtime-preview`，但用户访问的是**已发布版本**，仍在发送旧模型名
2. **`log-api-cost` 边缘函数未重新部署**：该函数的 `MODEL_COSTS` 仍包含 `gpt-4o-realtime-preview-2024-12-17` 对应的高价（$0.04/$0.08），所以即使收到旧模型名，也按 4 倍价格计算成本
3. **成本被高估 4 倍**：今天的记录 ¥7.52、¥12.10、¥37.48 都是按贵模型价格算的，实际应该是 1/4

## 解决方案

### 1. 发布前端（用户需操作）
点击 Lovable 的 **Publish** 按钮，让最新的 `CoachVoiceChat.tsx` 生效。发布后新用户会话将正确发送 `gpt-4o-mini-realtime-preview`。

### 2. 修复 `log-api-cost` 边缘函数 — 加防护
在 `log-api-cost/index.ts` 中增加模型名自动纠正逻辑：如果收到 `gpt-4o-realtime-preview-2024-12-17`，自动替换为 `gpt-4o-mini-realtime-preview` 再计算成本。这样即使有未更新的旧客户端，也不会再按高价计算。

```typescript
// 在计算成本前，纠正旧模型名
let correctedModel = model;
if (model === 'gpt-4o-realtime-preview-2024-12-17') {
  correctedModel = 'gpt-4o-mini-realtime-preview';
}
```

### 3. 修复历史数据 — SQL 迁移
将 `api_cost_logs` 中所有 `gpt-4o-realtime-preview-2024-12-17` 的记录：
- `model` 改为 `gpt-4o-mini-realtime-preview`
- `estimated_cost_usd` 和 `estimated_cost_cny` 除以 4（因为 mini 价格是原来的 1/4）

### 4. 同步清理 `check-cost-alerts` 的告警消息
修正后成本降为原来的 1/4，大部分将不再触发 ¥5 阈值，告警自然减少。

## 文件清单

| 文件 | 改动 |
|------|------|
| `supabase/functions/log-api-cost/index.ts` | 加模型名自动纠正 + 部署 |
| 数据库迁移 SQL | 修正历史 api_cost_logs 的 model 和成本 |
| 用户操作 | 点击 Publish 发布前端 |

