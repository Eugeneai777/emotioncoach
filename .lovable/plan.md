

# 全站语音三级降级方案

## 当前状态

`CoachVoiceChat.tsx` 第 1340-1362 行已实现三级降级逻辑，但被 `if (mode === 'emotion')` 条件限制，**仅情绪教练**（`mode="emotion"`）会执行豆包降级。其他所有模式在 OpenAI Realtime 失败后直接跳到 WebSocket relay。

## 涉及页面（共 12 个入口，全部使用 `CoachVoiceChat` 组件）

| 页面 | mode | tokenEndpoint |
|------|------|---------------|
| 情绪教练 (Index.tsx) | `emotion` | `emotion-realtime-token` |
| 生活教练 (LifeCoachVoice.tsx) | `general` | `vibrant-life-realtime-token` |
| 亲子教练 (ParentCoach.tsx) | `general`/`parent_teen` | `vibrant-life-realtime-token` |
| 小劲 (XiaojinVoice.tsx) | `teen` | `vibrant-life-realtime-token` |
| 青少年教练 (TeenCoach.tsx) | `teen` | `vibrant-life-realtime-token` |
| 财富教练 (WealthCoachChat/Voice) | `general` | `wealth-assessment-realtime-token` |
| 婚姻教练 (MarriageAITools.tsx) | `general` | `marriage-realtime-token` |
| 女性教练 (MamaAssistant.tsx) | `general` | `vibrant-life-realtime-token` |
| 职场教练 (WorkplacePage.tsx) | `general` | `vibrant-life-realtime-token` |
| 我们AI (UsAI.tsx) | `general` | `vibrant-life-realtime-token` |
| 老人陪伴 (ElderCarePage.tsx) | `general` | `vibrant-life-realtime-token` |
| 超级入口 (SuperEntry.tsx) | `general` | `vibrant-life-realtime-token` |

## 修改方案

### 仅改 1 个文件：`src/components/coach/CoachVoiceChat.tsx`

**改动极小**：删除第 1341 行的 `if (mode === 'emotion')` 条件判断，让所有模式都走三级降级。

具体改动（约 2 行）：

```
// 修改前（第 1340-1362 行）：
if (mode === 'emotion') {
  console.log('[VoiceChat] 🎯 Emotion mode fallback: Trying Doubao Realtime');
  // ... 豆包降级逻辑 ...
}

// 修改后：
// 去掉 if (mode === 'emotion') 包裹，保留内部逻辑
console.log('[VoiceChat] 🎯 Fallback: Trying Doubao Realtime');
// ... 豆包降级逻辑不变 ...
```

**效果**：所有 12 个语音入口自动获得三级降级能力：
1. OpenAI Realtime 优先
2. 失败 → 豆包实时语音
3. 再失败 → WebSocket relay

**无需改动**：其他页面、Edge Function、数据库均不需要变动。

