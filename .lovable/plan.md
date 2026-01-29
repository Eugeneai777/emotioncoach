

## 让有劲AI智能语音教练主动拨打P2P通话的实现方案

### 需求理解

实现AI智能语音教练能够**主动发起**通话给用户，用于：
- 定期关心问候
- 预约/训练营提醒
- 情绪低落时的主动关怀
- 不活跃用户唤回

---

### 现有系统架构分析

| 模块 | 当前状态 | 说明 |
|:-----|:---------|:-----|
| **P2P通话** | ✅ 已实现 | `useCoachCall.ts` - 真人教练与用户之间的WebRTC通话 |
| **AI语音** | ✅ 已实现 | `CoachVoiceChat.tsx` - 用户主动发起的OpenAI Realtime语音对话 |
| **来电UI** | ✅ 已实现 | `IncomingCallDialog.tsx` - 来电弹窗 + 铃声 + 振动 |
| **智能通知** | ✅ 已实现 | `generate-smart-notification` - AI生成个性化消息 |
| **微信推送** | ✅ 已实现 | `send-wechat-template-message` - 模板消息通知 |

**关键发现**：
- 现有P2P通话是**人对人**的WebRTC连接
- AI语音是**用户主动发起**的，不支持来电
- 两套系统目前是**独立**的

---

### 技术挑战

1. **用户必须在线且在App内**
   - Web应用无法像原生App那样后台唤醒用户
   - 浏览器关闭后无法接收来电

2. **WebRTC需要双向建立**
   - 发起方需要生成Offer
   - 接收方需要在线响应

3. **AI语音不是"用户"**
   - 现有架构中，通话双方都是数据库中的真实用户
   - AI没有`user_id`，无法作为`caller_id`

---

### 解决方案

采用**混合推送 + 应用内来电**的架构：

```text
┌─────────────────────────────────────────────────────────┐
│                    触发层（后端调度）                     │
│  ┌───────────┐   ┌───────────┐   ┌───────────────────┐  │
│  │ Cron任务  │   │ 事件触发  │   │  管理员手动触发   │  │
│  └─────┬─────┘   └─────┬─────┘   └─────────┬─────────┘  │
│        │               │                   │            │
│        └───────────────┼───────────────────┘            │
│                        ▼                                │
│              ┌───────────────────┐                      │
│              │ initiate-ai-call  │ (新Edge Function)    │
│              │ 1. 检查用户在线状态                       │
│              │ 2. 选择合适的推送渠道                     │
│              │ 3. 创建ai_coach_calls记录                │
│              └─────────┬─────────┘                      │
│                        │                                │
└────────────────────────┼────────────────────────────────┘
                         │
                         ▼
           ┌─────────────────────────┐
           │     推送分发策略        │
           ├─────────────────────────┤
           │ 用户在线？              │
           │   ├─ 是 → Realtime推送  │──▶ 应用内来电弹窗
           │   └─ 否 → 微信模板消息  │──▶ 引导用户打开App
           └─────────────────────────┘
                         │
                         ▼ (用户接听)
           ┌─────────────────────────┐
           │   AI语音对话建立        │
           │ 1. 用户点击接听         │
           │ 2. 获取OpenAI Token     │
           │ 3. 建立语音连接         │
           │ 4. AI主动开场白         │
           └─────────────────────────┘
```

---

### 数据库设计

**新增表：`ai_coach_calls`**

| 字段 | 类型 | 说明 |
|:-----|:-----|:-----|
| `id` | uuid | 主键 |
| `user_id` | uuid | 被叫用户 |
| `scenario` | text | 场景：`care`/`reminder`/`reactivation` |
| `call_status` | text | 状态：`pending`/`ringing`/`connected`/`missed`/`rejected`/`completed` |
| `coach_type` | text | AI教练类型：`vibrant_life`/`emotion`/`parent` |
| `opening_message` | text | AI开场白（预生成） |
| `context` | jsonb | 上下文数据 |
| `scheduled_at` | timestamptz | 计划拨打时间 |
| `ring_started_at` | timestamptz | 开始响铃时间 |
| `connected_at` | timestamptz | 用户接听时间 |
| `ended_at` | timestamptz | 通话结束时间 |
| `duration_seconds` | int | 通话时长 |
| `created_at` | timestamptz | 创建时间 |

---

### 实施步骤

#### 第一步：创建数据库表和Realtime订阅

**迁移SQL**：
```sql
CREATE TABLE public.ai_coach_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario TEXT NOT NULL CHECK (scenario IN ('care', 'reminder', 'reactivation', 'camp_followup', 'emotion_check')),
  call_status TEXT NOT NULL DEFAULT 'pending' CHECK (call_status IN ('pending', 'ringing', 'connected', 'missed', 'rejected', 'completed')),
  coach_type TEXT NOT NULL DEFAULT 'vibrant_life',
  opening_message TEXT,
  context JSONB DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  ring_started_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_ai_coach_calls_user_status ON ai_coach_calls(user_id, call_status);
CREATE INDEX idx_ai_coach_calls_scheduled ON ai_coach_calls(scheduled_at) WHERE call_status = 'pending';

-- 启用Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_coach_calls;

-- RLS策略
ALTER TABLE ai_coach_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI calls" ON ai_coach_calls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all" ON ai_coach_calls FOR ALL USING (true);
```

---

#### 第二步：创建Edge Function `initiate-ai-call`

**功能**：
- 接收触发请求（用户ID + 场景）
- 调用AI生成个性化开场白
- 创建`ai_coach_calls`记录
- 更新状态为`ringing`触发Realtime推送
- 若用户不在线，发送微信模板消息

**核心代码结构**：
```typescript
// supabase/functions/initiate-ai-call/index.ts
serve(async (req) => {
  const { user_id, scenario, context } = await req.json();
  
  // 1. 生成AI开场白
  const openingMessage = await generateOpeningMessage(scenario, context);
  
  // 2. 创建通话记录
  const { data: call } = await supabase
    .from('ai_coach_calls')
    .insert({
      user_id,
      scenario,
      coach_type: context?.coach_type || 'vibrant_life',
      opening_message: openingMessage,
      context,
      call_status: 'ringing',
      ring_started_at: new Date().toISOString()
    })
    .select()
    .single();
  
  // 3. 设置30秒超时自动标记为missed
  EdgeRuntime.waitUntil(
    handleCallTimeout(call.id, 30000)
  );
  
  // 4. 发送微信备用通知（用户可能不在App内）
  await supabase.functions.invoke('send-wechat-template-message', {
    body: {
      userId: user_id,
      scenario: 'ai_coach_calling',
      title: '有劲AI教练来电',
      content: '您有一通关心来电，点击接听'
    }
  });
  
  return new Response(JSON.stringify({ success: true, call_id: call.id }));
});
```

---

#### 第三步：创建前端AI来电监听Hook

**新增文件**：`src/hooks/useAICoachIncomingCall.ts`

**功能**：
- 订阅`ai_coach_calls`表的Realtime变更
- 当有新的`ringing`状态记录时触发来电弹窗
- 提供接听/拒绝方法

```typescript
export function useAICoachIncomingCall() {
  const [incomingCall, setIncomingCall] = useState<AICoachCall | null>(null);
  
  useEffect(() => {
    const channel = supabase
      .channel('ai-coach-calls')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_coach_calls',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (payload.new.call_status === 'ringing') {
          setIncomingCall(payload.new);
          // 播放铃声 + 振动
        }
      })
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [userId]);
  
  const answerCall = async (callId: string) => {
    // 1. 更新状态为 connected
    await supabase.from('ai_coach_calls')
      .update({ call_status: 'connected', connected_at: new Date().toISOString() })
      .eq('id', callId);
    
    // 2. 打开语音对话界面，传入开场白
    setIncomingCall(null);
    return { openingMessage: incomingCall.opening_message };
  };
  
  const rejectCall = async (callId: string) => {
    await supabase.from('ai_coach_calls')
      .update({ call_status: 'rejected', ended_at: new Date().toISOString() })
      .eq('id', callId);
    setIncomingCall(null);
  };
  
  return { incomingCall, answerCall, rejectCall };
}
```

---

#### 第四步：创建AI来电弹窗组件

**新增文件**：`src/components/coach-call/AIIncomingCallDialog.tsx`

复用现有`IncomingCallDialog`的UI样式，修改：
- 显示AI教练头像和名称（如"有劲AI教练"）
- 显示来电原因（如"想关心一下你最近的状态"）

---

#### 第五步：修改CoachVoiceChat支持被动接入

**修改**：`src/components/coach/CoachVoiceChat.tsx`

新增Props：
```typescript
interface CoachVoiceChatProps {
  // ... existing props
  isIncomingCall?: boolean;        // 是否是来电（被动接入）
  aiCallId?: string;               // ai_coach_calls ID
  openingMessage?: string;         // AI预设开场白
}
```

当`isIncomingCall=true`时：
- 跳过用户主动发起流程
- AI先说开场白（通过`response.create`强制AI先说话）
- 连接后调用OpenAI发送预设开场白

---

#### 第六步：创建定时触发任务

**新增Edge Function**：`batch-trigger-ai-coach-calls`

```typescript
// 场景调度逻辑
const scenarios = [
  {
    type: 'care',
    query: '最近情绪低落但未主动求助的用户',
    schedule: 'daily 10:00'
  },
  {
    type: 'reactivation', 
    query: '7天未活跃用户',
    schedule: 'daily 14:00'
  },
  {
    type: 'camp_followup',
    query: '训练营未完成今日任务的用户',
    schedule: 'daily 20:00'
  }
];
```

---

### 涉及文件

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| `supabase/functions/initiate-ai-call/index.ts` | 新增 | 发起AI来电的核心逻辑 |
| `supabase/functions/batch-trigger-ai-coach-calls/index.ts` | 新增 | 批量触发定时任务 |
| `src/hooks/useAICoachIncomingCall.ts` | 新增 | 监听AI来电的Hook |
| `src/components/coach-call/AIIncomingCallDialog.tsx` | 新增 | AI来电弹窗组件 |
| `src/components/coach-call/AICoachCallProvider.tsx` | 新增 | AI来电状态管理Provider |
| `src/components/coach/CoachVoiceChat.tsx` | 修改 | 支持被动接入模式 |
| `src/App.tsx` | 修改 | 添加AICoachCallProvider |
| 数据库迁移 | 新增 | 创建`ai_coach_calls`表 |

---

### 限制与注意事项

| 限制 | 说明 | 应对措施 |
|:-----|:-----|:---------|
| 用户必须打开App | Web应用无法后台唤醒 | 微信消息引导用户打开App |
| 铃声需要用户交互 | 浏览器限制自动播放音频 | 首次使用语音后存储权限 |
| 通话费用 | AI语音消耗点数 | 来电前检查用户余额 |

---

### 预期效果

1. **触发场景**：
   - 用户7天未活跃 → AI主动来电关心
   - 用户情绪连续低落 → AI来电提供支持
   - 训练营任务未完成 → AI来电温柔提醒

2. **用户体验**：
   - 用户在App内 → 直接弹出来电界面 + 铃声
   - 用户不在App内 → 收到微信消息"有劲AI想跟你聊聊" → 点击打开App → 自动接入通话

3. **对话内容**：
   - AI先主动说话（"hi，最近好像没看到你来记录情绪，想问问你最近怎么样..."）
   - 基于用户历史记忆进行个性化关怀

