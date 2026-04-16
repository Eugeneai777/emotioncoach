

# 语音通话描述中文化 — 消除英文技术术语

## 问题

截图中显示 `有劲生活教练语音对话扣费` 但退款记录显示 `realtime_voice_vibrant_life退款`，原因是：

1. **后端 `deduct-quota`** 的 `FEATURE_SCENE_MAP` 缺少 `realtime_voice_vibrant_life`、`realtime_voice_wealth_assessment` 等 key，导致 fallback 到英文原始值
2. **前端 `VoiceUsageSection.tsx`** 的 `SOURCE_LABELS` 同样缺少这些 key，无法将已入库的英文描述/source 转为中文

## 修改方案

### 1. 后端：`supabase/functions/deduct-quota/index.ts`

补全 `FEATURE_SCENE_MAP`：

```typescript
const FEATURE_SCENE_MAP: Record<string, string> = {
  realtime_voice: '生活教练语音',
  realtime_voice_emotion: '情绪教练语音',
  realtime_voice_wealth: '财富教练语音',
  realtime_voice_wealth_assessment: '财富教练语音',  // 新增
  realtime_voice_vibrant_life: '有劲生活教练语音',   // 新增
  realtime_voice_teen: '青少年教练语音',
  realtime_voice_career: '职场教练语音',
  realtime_voice_parent: '亲子教练语音',
  realtime_voice_relationship: '关系教练语音',
};
```

### 2. 前端：`src/components/VoiceUsageSection.tsx`

在 `SOURCE_LABELS` 中补全缺失的 feature key 映射：

```typescript
// 补充所有 realtime_voice_* feature keys
realtime_voice: "语音通话",
realtime_voice_emotion: "情绪教练语音",
realtime_voice_vibrant_life: "有劲生活教练语音",
realtime_voice_wealth_assessment: "财富教练语音",
realtime_voice_teen: "青少年教练语音",
realtime_voice_parent: "亲子教练语音",
realtime_voice_career: "职场教练语音",
realtime_voice_relationship: "关系教练语音",
```

同时在 `humanizeDescription` 中增加一个通用兜底：将任何残留的 `realtime_voice_*` 英文字符串替换为中文。

### 3. 后端：`supabase/functions/refund-failed-voice-call/index.ts`

检查退款函数中描述是否也有类似问题，确保退款记录的 description 也使用中文。

## 修改文件

| 文件 | 改动 |
|------|------|
| `supabase/functions/deduct-quota/index.ts` | 补全 FEATURE_SCENE_MAP 映射 |
| `src/components/VoiceUsageSection.tsx` | 补全 SOURCE_LABELS + humanizeDescription 兜底 |
| `supabase/functions/refund-failed-voice-call/index.ts` | 退款描述同步中文化 |

不涉及数据库改动。历史已入库的英文记录通过前端 `humanizeDescription` 兼容显示。

