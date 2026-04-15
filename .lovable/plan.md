

# 女性专区语音教练改为温柔女声

## 问题
女性专区（MamaAssistant）的语音教练当前使用男声（`echo`），因为：
1. 前端传的 `voiceType` 是旧版豆包ID `zh_female_xinlingjitang_moon_bigtts`（无效）
2. 边缘函数 `vibrant-life-realtime-token` 收到 `voice_type` 但完全忽略，硬编码为 `mode === 'teen' ? "shimmer" : "echo"`

## 方案（两处改动）

### 1. 边缘函数：读取并使用 `voice_type` 参数

**文件：`supabase/functions/vibrant-life-realtime-token/index.ts`**

- 解析请求体时增加读取 `voice_type`（第 1174-1177 行）
- 创建 session 时使用传入的 `voice_type`，缺省保持原逻辑（第 1413 行）

```typescript
// 解析时增加
const body = await req.json();
mode = body.mode || 'general';
scenario = body.scenario || null;
const voiceOverride = body.voice_type || null; // 新增

// 创建 session 时
voice: voiceOverride || (mode === 'teen' ? "shimmer" : "echo"),
```

### 2. 前端：传正确的 OpenAI voice 名称

**文件：`src/pages/MamaAssistant.tsx`**（第 280 行）

将 `voiceType="zh_female_xinlingjitang_moon_bigtts"`（无效旧ID）改为 `voiceType="shimmer"`（OpenAI Realtime 温柔女声）。

```diff
- voiceType="zh_female_xinlingjitang_moon_bigtts"
+ voiceType="shimmer"
```

OpenAI Realtime 可用女声：`shimmer`（温柔亲切）和 `coral`（清新自然），选择 `shimmer` 最符合"温柔女声"定位。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `supabase/functions/vibrant-life-realtime-token/index.ts` | 解析并使用 `voice_type` 参数 |
| `src/pages/MamaAssistant.tsx` | voiceType 改为 `shimmer` |

改动极小，不影响其他教练场景（它们不传 `voice_type`，走默认逻辑）。

