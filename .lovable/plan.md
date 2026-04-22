

## 4 个新场景听不到对应"开场白"的根因

### 根因
`LifeCoachVoice` 用的是 **PTT（按住说话）模式**。后端 `SCENARIO_CONFIGS` 里的 `opening` 字段（如「嘿，先别憋着…我在，想哭就哭出来」）只写在 system prompt 末尾的 `开场："..."`，**它是给模型看的指令，而不是真正自动播报的第一句话**。

OpenAI Realtime 模型只有在收到 `response.create` 事件时才会输出语音。当前的 PTT 流程：
1. 数据通道 open → 不触发 `response.create`
2. 用户按住按钮说话 → 松手时才发 `response.create`
3. 模型基于"用户说的内容 + 系统提示"生成回复 —— 此时早已不是开场场景，`opening` 文本被模型当作"参考语气"而非"必须念的台词"，于是听起来像通用回复。

> 与 `realtime-token`（小劲客服，VAD 模式）不同：那条链路里 AI 自动开场是因为 VAD 模式下用户可能先沉默，OpenAI 在某些条件下会启动；但 PTT 强制等待用户输入，永远不会主动开场。

附加证据：4 个新场景的 SCENARIO key（`睡不着觉` `情绪崩溃` `考试焦虑` `社交困扰`）都已存在；topic 映射也对；token 请求 body 里 `scenario` 也正确传递（连接日志会打 `scenario: "情绪崩溃"`），所以**不是配置串错，是"开场白根本没机会被说出来"**。

### 修复方案

**在数据通道 open 后，主动注入一条"假装是用户说出场景的开场触发"事件，让 AI 立即按 `opening` 台词开口说第一句话。**

具体做法（PTT 模式专用，不影响通用 VAD 模式）：

#### A. 后端补充 `opening` 字段透传
`vibrant-life-realtime-token/index.ts` 在场景模式分支里，把 `SCENARIO_CONFIGS[scenario].opening` 一并放进返回 JSON：
```ts
return new Response(JSON.stringify({
  ...data,
  realtime_url: realtimeProxyUrl,
  mode,
  scenario_opening: scenario && SCENARIO_CONFIGS[scenario]?.opening || null,
  pending_session_config: ...
}));
```

#### B. 前端 PTT 模式自动播报开场
`src/utils/RealtimeAudio.ts` 中：
1. 新增 `private scenarioOpening: string | null = null` 字段
2. 在 `connect()` 拿到 token 时保存：`this.scenarioOpening = tokenData.scenario_opening`
3. 在 `dcOpenHandler` 里推送 session.update 之后，如果是 PTT 模式且有 `scenarioOpening`，发送：
   ```ts
   this.dc.send(JSON.stringify({
     type: 'response.create',
     response: {
       modalities: ['audio','text'],
       instructions: `请用温暖自然的语气作为开场说出（不要任何前缀或解释，直接说）：${this.scenarioOpening}`
     }
   }));
   ```
4. 仅触发一次（用 `this.scenarioOpening = null` 清掉）

> 走 `instructions` 覆盖而不是 `conversation.item.create` 注入"虚拟用户消息"，避免污染对话上下文，AI 不会以为用户说了什么。

#### C. （可选）UI 提示"AI 正在打招呼…"
`CoachVoiceChat` 收到第一个 `response.audio_transcript.delta` 之前显示一个"💬 AI 正在打招呼…"小气泡，让用户知道接通成功不是死机，等 AI 说完再按 PTT。

### 涉及文件
1. `supabase/functions/vibrant-life-realtime-token/index.ts` — 返回里加 `scenario_opening`
2. `src/utils/RealtimeAudio.ts` — `connect()` 接住字段；`dcOpenHandler` 里 PTT + 有开场白时自动 `response.create`
3. （可选）`src/components/coach/CoachVoiceChat.tsx` — "AI 正在打招呼"占位提示

### 不动
- 8 个 SCENARIO_CONFIGS 配置
- topic 映射 / 校验逻辑
- 计费、session 复用、PTT 录音主流程
- 通用 VAD 模式（无 scenario 时 `scenario_opening` 为 null，不触发自动开场，行为与现在一致）

### 验证清单
- [ ] 点击"😮‍💨 情绪崩溃" → 接通后 1-2 秒内自动听到「嘿，先别憋着…我在，想哭就哭出来，慢慢说怎么了」
- [ ] 8 个场景各自播报对应 `opening`（睡不着觉/职场迷茫/关系困扰/财富卡点/深夜焦虑/考试焦虑/社交困扰/情绪崩溃）
- [ ] 开场结束后正常进入 PTT 流程，按住说话不受影响
- [ ] 没有 scenario 的通用模式（中心按钮）行为不变，仍由用户先说话

