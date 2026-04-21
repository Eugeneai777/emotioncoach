
## 修复 `/mama` 在 web 端仍然是男声

### 问题结论
`/mama` 前端页面本身已经传了女性音色 `EXAVITQu4vr4xnSDxMaL`，但 web 端并不只走一条语音链路。

当前存在 3 条可能路径：
1. WebRTC 直连 OpenAI Realtime
2. WebSocket relay 备用链路
3. 豆包 realtime 降级链路

现在只有第 1 条已支持女声音色映射；第 2、3 条仍会回到男声，所以用户在 web 端依然可能听到男声。

### 根因定位
#### 1) `/mama` 页面前端传参是对的
文件：`src/pages/MamaAssistant.tsx`

当前已明确传入：
```tsx
voiceType="EXAVITQu4vr4xnSDxMaL"
```

这层不是主问题。

#### 2) WebRTC 直连链路已基本修好
文件：
- `src/components/coach/CoachVoiceChat.tsx`
- `supabase/functions/vibrant-life-realtime-token/index.ts`

当前 WebRTC 创建 `RealtimeChat` 时，已经把：
```ts
{ ...extraBody, voice_type: voiceType }
```
传给 token 接口，且 token 接口也会把 `EXAVIT...` 映射成 `shimmer`。

所以“直连成功时”女声应能生效。

#### 3) WebSocket relay 备用链路仍然会男声
文件：
- `src/components/coach/CoachVoiceChat.tsx`
- `src/utils/MiniProgramAudio.ts`
- `supabase/functions/miniprogram-voice-relay/index.ts`

已确认两个问题：
- `CoachVoiceChat` 在走 `MiniProgramAudioClient` 时只传了 `extraBody`，**没有把 `voiceType` 塞进去**
- `miniprogram-voice-relay` 仍写死：
```ts
voice: mode === 'teen' ? 'shimmer' : 'echo'
```

结果：只要 web 端因为兼容性/网络原因从 WebRTC 降级到 relay，就又变成男声。

#### 4) 豆包降级链路也写死男声
文件：
- `src/components/coach/CoachVoiceChat.tsx`
- `supabase/functions/doubao-realtime-relay/index.ts`

已确认：
- WebRTC 失败后，`CoachVoiceChat` 会先降级到 `DoubaoRealtimeChat`
- `doubao-realtime-relay` 的 TTS speaker 当前硬编码为：
```ts
speaker: 'zh_male_yunzhou_jupiter_bigtts'
```

这会让 web 端在“OpenAI 失败 → 豆包兜底”时继续是男声。

### 实施方案
#### 1) 统一前端把 `voiceType` 传给所有链路
文件：`src/components/coach/CoachVoiceChat.tsx`

修改两处 `MiniProgramAudioClient` 初始化：
- 主 websocket 路径
- WebRTC 失败后的 websocket fallback 路径

把：
```ts
extraBody
```
改成：
```ts
{ ...extraBody, voice_type: voiceType }
```

这样 relay 路径也能收到 `/mama` 的女性音色参数。

#### 2) 让 `MiniProgramAudioClient` 保持透传 `voice_type`
文件：`src/utils/MiniProgramAudio.ts`

确认并保持 token 请求体继续使用：
```ts
{ mode, scenario, ...extraBody }
```

因为第 1 步后 `extraBody` 中会包含 `voice_type`，这里无需改业务逻辑，只需确保不会被覆盖。

#### 3) 修复 `miniprogram-voice-relay` 的音色映射
文件：`supabase/functions/miniprogram-voice-relay/index.ts`

新增与 `vibrant-life-realtime-token` 一致的映射函数：
- Brian → `echo`
- George → `ash`
- Sarah → `shimmer`
- Lily → `coral`

并让 relay 支持从客户端 `session_config` 或初始化参数中接收 voice 信息，替换当前写死逻辑：
```ts
voice: mode === 'teen' ? 'shimmer' : 'echo'
```

改为统一走映射后的 voice。

#### 4) 修复豆包降级链路的女声
文件：`supabase/functions/doubao-realtime-relay/index.ts`

把当前硬编码男声：
```ts
speaker: 'zh_male_yunzhou_jupiter_bigtts'
```

改为支持根据传入 `voice_type` 映射到豆包女声 speaker。

建议映射：
- `EXAVITQu4vr4xnSDxMaL` → `zh_female_cancan_mars_bigtts`
- `pFZP5JQG7iQjIQuC4Bku` → `zh_female_wanwanxiaohe_moon_bigtts`
- 男声音色继续保留各自映射
- 未识别值再回退默认

这样即使 web 端走豆包兜底，`/mama` 也仍是温柔女声。

#### 5) 保持 `/mama` 页面继续强制女声
文件：`src/pages/MamaAssistant.tsx`

继续保留：
```tsx
voiceType="EXAVITQu4vr4xnSDxMaL"
```

不改全站默认男声策略，只修复女性教练入口的人设一致性。

### 不改范围
- 语音计费/扣点逻辑不动
- 历史会话与简报逻辑不动
- 其它教练页默认音色策略不动
- `/mama` 页面 UI、头像、文案不动
- 认证、支付、训练营等无关逻辑不动

### 预期结果
修完后，`/mama` 的女性 AI 教练在以下情况都应保持女声：
1. WebRTC 直连成功
2. WebRTC 失败后切到 WebSocket relay
3. WebRTC 失败后切到豆包 realtime fallback

也就是“所有 web 端链路统一女声”，不再只修一条链路。

### 验证步骤
1. 打开 `https://wechat.eugenewe.net/mama`
2. 登录后进入“女性AI语音教练”
3. 在普通浏览器中测试首次开口，应为明显温柔女声
4. 人为触发网络较差场景或备用通道场景，确认 fallback 后仍是女声
5. 抽查默认男声的生活教练页，确认仍保持原逻辑
6. 检查两条后端日志：
   - `miniprogram-voice-relay`：确认收到女性 `voice_type` 并映射为 `shimmer`
   - `doubao-realtime-relay`：确认 `/mama` 不再使用男声 `speaker`

### 涉及文件
- `src/pages/MamaAssistant.tsx`
- `src/components/coach/CoachVoiceChat.tsx`
- `src/utils/MiniProgramAudio.ts`
- `supabase/functions/miniprogram-voice-relay/index.ts`
- `supabase/functions/doubao-realtime-relay/index.ts`

### 技术细节
当前真正的系统性问题不是“页面没传女声”，而是“只有主链路支持女声，fallback 链路仍写死男声”。

统一目标应是：

```text
MamaAssistant
  -> CoachVoiceChat(voiceType = Sarah)
    -> WebRTC token path        -> shimmer
    -> WebSocket relay path     -> shimmer
    -> Doubao fallback path     -> female speaker
```
