## 目标
将全站 OpenAI Realtime 语音模型从 `gpt-4o-mini-realtime-preview`（preview）统一升级到 `gpt-realtime-mini`（GA 正式版），确保所有 AI 语音入口稳定可用。

## 背景
当前共 14 处硬编码使用 preview 模型，分布在 7 个 token 端点、1 个 WS 中继、3 个前端 client、2 个计费表中。GA 版 `gpt-realtime-mini` 与 preview 价格相同（$10/M input、$20/M output），但 SLA 更稳定、不再属"preview 限流池"。

## 改动清单（仅替换模型字符串，业务逻辑不动）

**Edge Functions (7)**
- `supabase/functions/realtime-token/index.ts:80`
- `supabase/functions/emotion-realtime-token/index.ts:276`
- `supabase/functions/wealth-assessment-realtime-token/index.ts:159`
- `supabase/functions/marriage-realtime-token/index.ts:195`
- `supabase/functions/teen-realtime-token/index.ts:200`
- `supabase/functions/vibrant-life-realtime-token/index.ts:1398, 1652`
- `supabase/functions/miniprogram-voice-relay/index.ts:13`（WSS URL 的 model 参数）

**前端 (3)**
- `src/utils/RealtimeAudio.ts:875`
- `src/components/coach/CoachVoiceChat.tsx:766`
- `src/components/teen/TeenVoiceChat.tsx:217`

**计费 / 日志兼容 (2)**
- `src/utils/apiCostTracker.ts`：新增 `gpt-realtime-mini` 价格条目（$0.01/$0.02），保留 preview 条目兼容历史日志；默认模型字符串改为 `gpt-realtime-mini`
- `supabase/functions/log-api-cost/index.ts`：同上，新增价格条目，保留旧 key 防止历史日志报错

## 部署 & 验证
1. 部署 7 个 token 端点 + log-api-cost + miniprogram-voice-relay
2. 用 `curl_edge_functions` 调 `realtime-token` 拿一次 token，确认返回的 session 含正确 model
3. 抽查 edge function logs 看是否有 OpenAI 4xx
4. 前端不需要额外动作（vite HMR 自动）

## 风险与回退
- `gpt-realtime-mini` 是 OpenAI 2025-08 GA 模型，国内通过 `OPENAI_PROXY_URL` 走代理；若代理白名单未放行新 model，可能 404。回退方案：把模型字符串改回 `gpt-4o-mini-realtime-preview` 即可（一次 search-replace）
- 不改任何 voice 配置、scenario、prompt、计费金额、配额扣减逻辑

## 不在本次范围
- 不引入自动降级 fallback（保持简单，如需可后续追加）
- 不接入 `gpt-realtime`（非 mini，贵 4 倍）
- 不改 Doubao TTS / ElevenLabs 相关代码