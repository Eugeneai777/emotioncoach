

# 在 doubao-realtime-relay 的 audio 配置中添加 keep_alive

## 现状

`supabase/functions/doubao-realtime-relay/index.ts` L523-532 的 `audio` 配置只有 format/sample_rate/bits/channel，没有 `keep_alive`。`keep_alive` 目前只在 `dialog.extra.input_mod` 中设置。

## 改动

**文件**: `supabase/functions/doubao-realtime-relay/index.ts`（L525-531）

在 `audio` 对象中添加 `keep_alive: true`：

```typescript
audio: {
  format: 'pcm',
  sample_rate: 16000,
  bits: 16,
  channel: 1,
  keep_alive: true  // ← 新增
},
```

仅 1 处改动，1 个文件。

