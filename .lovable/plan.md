
## 修复 `/mama` 女性AI教练仍然是男声

### 问题结论
`/mama` 页面前端已经传了女声音色 ID：`EXAVITQu4vr4xnSDxMaL`，但后端 token 接口 `vibrant-life-realtime-token` 并没有把这个 ElevenLabs 音色 ID 映射成 OpenAI Realtime 需要的原生 voice 名称，而是直接把它当成 `voice` 发给 realtime session。

现在后端实际逻辑是：
- 收到 `voice_type = EXAVITQu4vr4xnSDxMaL`
- 直接发送：`voice: EXAVITQu4vr4xnSDxMaL`
- OpenAI Realtime 实际需要的是：`shimmer / echo / coral / ash` 这类值
- 结果就回退到默认男声链路，表现为头像是女性、声音却还是男声

### 根因定位
1. `src/pages/MamaAssistant.tsx`
   - 已显式传入女性音色 `EXAVITQu4vr4xnSDxMaL`
   - 前端页面本身不是主问题

2. `src/components/coach/CoachVoiceChat.tsx`
   - 会把 `voiceType` 通过 `voice_type` 传给 token 接口
   - 这一层传参是通的

3. `supabase/functions/vibrant-life-realtime-token/index.ts`
   - 读取 `body.voice_type`
   - 直接写入 realtime session 的 `voice`
   - 这里缺少“ElevenLabs ID -> OpenAI voice 名称”的转换，是核心 bug

4. `src/config/voiceTypeConfig.ts`
   - 已经有正确映射关系：
     - Brian -> `echo`
     - George -> `ash`
     - Sarah -> `shimmer`
     - Lily -> `coral`
   - 但这个映射当前没有在 token 端真正生效

### 实施方案
#### 1) 在 token 接口补上统一音色映射
文件：
- `supabase/functions/vibrant-life-realtime-token/index.ts`

改法：
- 新增一个后端安全映射函数，把收到的 `voice_type` 转成 OpenAI Realtime voice
- 只允许白名单映射，非法值自动回退默认值
- 逻辑示意：

```ts
function mapVoiceTypeToOpenAIVoice(voiceType: string | null, mode: string) {
  const fallback = mode === 'teen' ? 'shimmer' : 'echo';

  const voiceMap: Record<string, string> = {
    'nPczCjzI2devNBz1zQrb': 'echo',
    'JBFqnCBsd6RMkjVDRZzb': 'ash',
    'EXAVITQu4vr4xnSDxMaL': 'shimmer',
    'pFZP5JQG7iQjIQuC4Bku': 'coral',
  };

  return voiceType && voiceMap[voiceType] ? voiceMap[voiceType] : fallback;
}
```

然后把：
```ts
voice: voiceOverride || (mode === 'teen' ? "shimmer" : "echo")
```

改为：
```ts
voice: mapVoiceTypeToOpenAIVoice(voiceOverride, mode)
```

#### 2) 保持 `/mama` 页面继续强制女声
文件：
- `src/pages/MamaAssistant.tsx`

保留现有：
```tsx
voiceType="EXAVITQu4vr4xnSDxMaL"
```

这样 `/mama` 会稳定映射到 `shimmer`，不受全站默认男声影响。

#### 3) 不改其它业务逻辑
明确不动：
- 语音计费逻辑
- 连接 / 降级链路
- 用户历史通话逻辑
- 其它教练页入口逻辑
- 本地保存的全局默认音色策略

### 预期收益
- `/mama` 女性AI教练立即变成稳定女声
- 同时顺带修正全站“传 ElevenLabs ID 但 realtime 未正确映射”的系统性问题
- 以后其它页面传女声音色时，也会真正生效，而不是暗中掉回男声

### 验证步骤
1. 打开 `https://wechat.eugenewe.net/mama`
2. 点击“女性AI语音教练”
3. 首次开口应为明显女声（Sarah/shimmer 风格）
4. 连续关闭再打开，不应再回到男声
5. 再抽查一个使用默认男声的页面，确认男声页面仍保持原逻辑不变
6. 检查 token 接口日志，确认传入的是 `voice_type=EXAVIT...`，实际创建 realtime session 时使用的是 `voice=shimmer`

### 涉及文件
- `supabase/functions/vibrant-life-realtime-token/index.ts`
- `src/pages/MamaAssistant.tsx`（大概率无需再改，仅确认保留）
