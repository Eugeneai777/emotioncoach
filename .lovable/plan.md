

## 为AI主动来电添加"感恩提醒"场景

### 需求分析

**目标**：通过AI来电提醒用户记录感恩日记，每天3次来电，帮助用户建立感恩习惯。

**触发时机建议**：
- 早晨 8:00 - "开启美好的一天，记录今天的期待"
- 中午 12:30 - "午间小憩，回顾上午的小确幸"  
- 晚上 21:00 - "睡前回顾，记录今天的感恩时刻"

**核心价值**：
- 建立每日感恩的习惯节奏
- 在来电中直接引导用户口述感恩内容
- 通话结束后自动保存到 `gratitude_entries` 表

---

### 技术方案

#### 第一步：数据库扩展

**1.1 扩展 scenario 约束**

```sql
-- 更新 ai_coach_calls 表的 scenario 约束
ALTER TABLE public.ai_coach_calls 
DROP CONSTRAINT IF EXISTS ai_coach_calls_scenario_check;

ALTER TABLE public.ai_coach_calls 
ADD CONSTRAINT ai_coach_calls_scenario_check 
CHECK (scenario IN (
  'care', 'reminder', 'reactivation', 'camp_followup', 
  'emotion_check', 'late_night_companion', 'gratitude_reminder'
));
```

**1.2 创建感恩来电记录表（可选，用于追踪用户参与度）**

```sql
-- 追踪每日感恩来电情况
CREATE TABLE IF NOT EXISTS public.gratitude_call_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_id UUID REFERENCES ai_coach_calls(id),
  call_time_slot TEXT NOT NULL, -- 'morning' | 'noon' | 'evening'
  gratitude_content TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  date DATE DEFAULT CURRENT_DATE
);

-- RLS
ALTER TABLE public.gratitude_call_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own gratitude records" ON public.gratitude_call_records
  FOR ALL USING (auth.uid() = user_id);
```

---

#### 第二步：更新 Edge Functions

**2.1 更新 `initiate-ai-call/index.ts`**

| 修改项 | 内容 |
|:-------|:-----|
| 类型定义 | 添加 `'gratitude_reminder'` 到 scenario 类型 |
| SCENARIO_PROMPTS | 添加三个时段专属提示词 |
| getDefaultMessage | 添加感恩提醒默认消息 |

```typescript
// 新增场景提示词（根据 context.time_slot 区分）
gratitude_reminder: '生成一句温暖的感恩提醒开场白，根据时间段调整语气：
  - morning: 鼓励用户开启充满感恩的一天，问候时提到"新的一天"
  - noon: 邀请用户暂停片刻，回顾上午的小确幸
  - evening: 温柔地引导用户回顾今天值得感恩的时刻，准备安眠',

// 新增默认消息（分时段）
gratitude_reminder: {
  morning: `早安${name}！新的一天，想和你一起发现值得感恩的事～`,
  noon: `${name}，午间小憩，来记录一下上午的小确幸？`,
  evening: `${name}，睡前想和你聊聊今天值得感恩的时刻～`
}
```

**2.2 更新 `batch-trigger-ai-coach-calls/index.ts`**

添加感恩提醒场景触发逻辑：

```typescript
// 感恩提醒场景（每天3次：8:00, 12:30, 21:00）
const gratitudeTimeSlots = [
  { hour: 8, slot: 'morning' },
  { hour: 12, minute: 30, slot: 'noon' },
  { hour: 21, slot: 'evening' }
];

if (scenario === 'gratitude_reminder' || (!scenario && isGratitudeTime(hour, minute))) {
  const currentSlot = getTimeSlot(hour, minute); // 'morning' | 'noon' | 'evening'
  
  // 1. 获取活跃用户（最近1小时有活动 或 最近7天使用过感恩日记）
  const { data: gratitudeUsers } = await supabase
    .from('gratitude_entries')
    .select('user_id')
    .gte('created_at', sevenDaysAgo)
    .limit(limit);
  
  // 去重并获取用户ID列表
  const uniqueUserIds = [...new Set(gratitudeUsers?.map(e => e.user_id))];
  
  for (const userId of uniqueUserIds) {
    // 2. 检查今天该时段是否已经来电过
    const { data: existingCall } = await supabase
      .from('ai_coach_calls')
      .select('id')
      .eq('user_id', userId)
      .eq('scenario', 'gratitude_reminder')
      .gte('created_at', todayStart)
      .contains('context', { time_slot: currentSlot })
      .limit(1);
    
    if (existingCall && existingCall.length > 0) {
      continue; // 已来电过，跳过
    }
    
    // 3. 触发感恩提醒来电
    await supabase.functions.invoke('initiate-ai-call', {
      body: {
        user_id: userId,
        scenario: 'gratitude_reminder',
        coach_type: 'gratitude',
        context: {
          time_slot: currentSlot,
          time_of_day: currentSlot,
        },
      },
    });
  }
}
```

---

#### 第三步：更新前端组件

**3.1 更新 `useAICoachIncomingCall.ts`**

```typescript
// 类型定义
scenario: 'care' | 'reminder' | 'reactivation' | 'camp_followup' | 
          'emotion_check' | 'late_night_companion' | 'gratitude_reminder';

// 场景标签（分时段）
const SCENARIO_LABELS = {
  // ...existing
  gratitude_reminder: '想和你一起发现值得感恩的事',
};
```

**3.2 更新 `AIIncomingCallDialog.tsx`**

```typescript
const COACH_INFO = {
  // ...existing
  gratitude_reminder: { 
    name: '感恩小助手', 
    emoji: '🌸', 
    color: 'from-rose-400 to-pink-500' 
  },
};

// 感恩提醒场景使用温暖配色
const isGratitudeReminder = scenario === 'gratitude_reminder';
const coachInfo = isGratitudeReminder 
  ? COACH_INFO.gratitude_reminder
  : isLateNight 
    ? COACH_INFO.late_night 
    : COACH_INFO[coachType] || COACH_INFO.vibrant_life;
```

**3.3 来电接听后跳转到感恩教练**

在接听 `gratitude_reminder` 来电后，可以直接跳转到感恩教练页面或打开感恩快速添加组件：

```typescript
// 在 App.tsx 或来电处理逻辑中
if (call.scenario === 'gratitude_reminder') {
  navigate('/coach/gratitude_coach');
  // 或者直接打开快速添加对话框
}
```

---

### 涉及文件清单

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| 数据库迁移 | 新建 | 扩展 scenario 约束，可选添加记录表 |
| `supabase/functions/initiate-ai-call/index.ts` | 修改 | 添加 gratitude_reminder 场景 |
| `supabase/functions/batch-trigger-ai-coach-calls/index.ts` | 修改 | 添加3次/天触发逻辑 |
| `src/hooks/useAICoachIncomingCall.ts` | 修改 | 扩展类型和标签 |
| `src/components/coach-call/AIIncomingCallDialog.tsx` | 修改 | 添加感恩提醒UI样式 |

---

### 触发条件总结

| 时段 | 时间 | 目标用户 | 开场语风格 |
|:-----|:-----|:---------|:-----------|
| 早晨 | 08:00 | 7天内使用过感恩日记 | 鼓励开启新一天 |
| 中午 | 12:30 | 7天内使用过感恩日记 | 回顾上午小确幸 |
| 晚上 | 21:00 | 7天内使用过感恩日记 | 睡前感恩回顾 |

**防重复机制**：同一用户同一时段当天只来电一次

---

### 用户体验流程

```text
用户早上8点收到来电 🌸
     ↓
看到「感恩小助手」+ "想和你一起发现值得感恩的事"
     ↓
接听后 AI："早安！新的一天开始了，有什么让你期待或感恩的吗？"
     ↓
用户口述感恩内容
     ↓
AI 引导记录 + 自动保存到 gratitude_entries
     ↓
中午12:30 再次来电，回顾上午
     ↓
晚上21:00 最后一次，睡前感恩
```

---

### 预期效果

**习惯养成**：
- 固定时间点的"感恩仪式感"
- 3次/天的温柔提醒，不打扰但持续陪伴
- 语音交互降低记录门槛

**情感连接**：
- AI主动关心，建立"被惦记"的感觉
- 分时段差异化开场白，体现理解用户的一天
- 感恩内容自动保存，减少用户操作

