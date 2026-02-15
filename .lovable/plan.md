

## 升级 Realtime 语音模型到 GA 正式版

### 变更内容

将所有文件中的 `gpt-4o-mini-realtime-preview-2024-12-17` 替换为 `gpt-4o-mini-realtime-preview`（OpenAI GA 正式版模型名称）。

> 注意：OpenAI 的 GA 正式版模型 ID 为 `gpt-4o-mini-realtime-preview`，而非 `gpt-realtime-mini`。`gpt-realtime-mini` 尚未在 Realtime Sessions API 中正式发布。实际可用的稳定版本为去掉日期后缀的 `gpt-4o-mini-realtime-preview`，它会自动指向最新的稳定版本。

### 涉及文件（10 个文件）

| 文件 | 类型 | 说明 |
|------|------|------|
| `supabase/functions/realtime-token/index.ts` | Edge Function | 小劲客服语音 |
| `supabase/functions/emotion-realtime-token/index.ts` | Edge Function | 情绪教练语音 |
| `supabase/functions/vibrant-life-realtime-token/index.ts` | Edge Function | 有劲生活教练语音 |
| `supabase/functions/wealth-assessment-realtime-token/index.ts` | Edge Function | 财富测评教练语音 |
| `supabase/functions/teen-realtime-token/index.ts` | Edge Function | 青少年教练语音 |
| `supabase/functions/miniprogram-voice-relay/index.ts` | Edge Function | 小程序 WebSocket 中继 |
| `supabase/functions/log-api-cost/index.ts` | Edge Function | API 成本记录 |
| `src/utils/RealtimeAudio.ts` | 前端 | WebRTC 连接 |
| `src/utils/apiCostTracker.ts` | 前端 | 成本追踪工具 |
| `src/components/teen/TeenVoiceChat.tsx` | 前端 | 青少年语音组件 |

### 具体变更

每个文件中，将模型字符串 `"gpt-4o-mini-realtime-preview-2024-12-17"` 统一替换为 `"gpt-4o-mini-realtime-preview"`。

对于 `apiCostTracker.ts` 和 `log-api-cost/index.ts` 中的 MODEL_COSTS 对象，同时更新 key 名称，并保留旧 key 作为兼容（避免历史日志查询报错）。

### 收益

- 自动跟随 OpenAI 最新稳定版本，无需手动跟踪日期后缀
- 获得 cached input 折扣（$0.30/M vs $2.50/M）
- GA 版本更稳定，减少 preview 版本的潜在问题

