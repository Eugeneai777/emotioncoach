

## 为AI主动来电添加"深夜陪伴"场景

### 需求分析

**目标**：在22:00-01:00期间，检测在线且情绪波动的用户，主动发起温暖的关心来电。

**核心挑战**：
1. 现有 `profiles` 表没有 `last_seen_at` 字段来追踪用户在线状态
2. 需要实时识别"正在使用App"的用户
3. 情绪数据存储在 `briefings` 表，需通过 `conversations` 关联

---

### 技术方案

#### 第一步：数据库扩展

**1.1 添加用户在线追踪字段**

```sql
-- 在 profiles 表添加 last_seen_at 字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen 
ON profiles(last_seen_at) WHERE last_seen_at > now() - INTERVAL '1 hour';
```

**1.2 扩展 scenario 约束**

```sql
-- 更新 ai_coach_calls 表的 scenario 约束
ALTER TABLE public.ai_coach_calls 
DROP CONSTRAINT IF EXISTS ai_coach_calls_scenario_check;

ALTER TABLE public.ai_coach_calls 
ADD CONSTRAINT ai_coach_calls_scenario_check 
CHECK (scenario IN ('care', 'reminder', 'reactivation', 'camp_followup', 'emotion_check', 'late_night_companion'));
```

---

#### 第二步：前端心跳机制

**文件**：`src/hooks/useUserPresence.ts`（新建）

实现用户活跃状态上报：

```typescript
// 每5分钟更新一次 last_seen_at
// 监听页面可见性变化
// 页面聚焦时立即上报
```

**集成位置**：`src/App.tsx` 添加 `<UserPresenceTracker />` 组件

---

#### 第三步：更新 Edge Functions

**3.1 更新 `initiate-ai-call/index.ts`**

| 修改项 | 内容 |
|:-------|:-----|
| 类型定义 | 添加 `'late_night_companion'` 到 scenario 类型 |
| SCENARIO_PROMPTS | 添加深夜陪伴专属提示词 |
| getDefaultMessage | 添加深夜陪伴默认消息 |

```typescript
// 新增场景提示词
late_night_companion: '生成一句温柔体贴的深夜问候开场白，像老朋友一样关心用户这么晚还没睡，语气要轻柔不打扰。'

// 新增默认消息
late_night_companion: `${name}，这么晚还没睡呀？想陪你聊聊～`
```

**3.2 更新 `batch-trigger-ai-coach-calls/index.ts`**

添加深夜陪伴场景触发逻辑：

```typescript
// 深夜陪伴场景（22:00-01:00触发）
if (scenario === 'late_night_companion' || (!scenario && (hour >= 22 || hour <= 1))) {
  // 1. 查找15分钟内活跃的用户
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  
  const { data: activeUsers } = await supabase
    .from('profiles')
    .select('id, display_name')
    .gte('last_seen_at', fifteenMinutesAgo)
    .limit(limit);
    
  // 2. 检查这些用户近期是否有情绪波动（3天内 emotion_intensity >= 6）
  for (const user of activeUsers) {
    const { data: recentEmotions } = await supabase
      .from('briefings')
      .select('emotion_intensity, emotion_theme, conversation:conversations!inner(user_id)')
      .eq('conversations.user_id', user.id)
      .gte('created_at', threeDaysAgo)
      .gte('emotion_intensity', 6)
      .limit(3);
      
    if (recentEmotions?.length >= 1) {
      // 触发深夜陪伴来电
      await supabase.functions.invoke('initiate-ai-call', {
        body: {
          user_id: user.id,
          scenario: 'late_night_companion',
          coach_type: 'emotion',
          context: {
            time_of_day: 'late_night',
            recent_emotion: recentEmotions[0]?.emotion_theme,
            emotion_intensity: recentEmotions[0]?.emotion_intensity,
          },
        },
      });
    }
  }
}
```

---

#### 第四步：更新前端组件

**4.1 更新 `useAICoachIncomingCall.ts`**

```typescript
// 类型定义
scenario: 'care' | 'reminder' | 'reactivation' | 'camp_followup' | 'emotion_check' | 'late_night_companion';

// 场景标签
const SCENARIO_LABELS = {
  // ...existing
  late_night_companion: '深夜了，想陪你聊聊',
};
```

**4.2 更新 `AIIncomingCallDialog.tsx`**

为深夜陪伴场景添加特殊视觉效果：

```typescript
// 深夜陪伴使用更温和的配色
const COACH_INFO = {
  // ...existing
  late_night: { name: '深夜陪伴', emoji: '🌙', color: 'from-indigo-600 to-purple-800' },
};

// 根据 scenario 选择配色
const isLateNight = scenario === 'late_night_companion';
const coachInfo = isLateNight 
  ? COACH_INFO.late_night 
  : COACH_INFO[coachType] || COACH_INFO.vibrant_life;
```

---

### 涉及文件清单

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| `src/hooks/useUserPresence.ts` | 新建 | 用户活跃状态心跳上报 |
| `src/App.tsx` | 修改 | 添加 `<UserPresenceTracker />` |
| `supabase/functions/initiate-ai-call/index.ts` | 修改 | 添加 late_night_companion 场景 |
| `supabase/functions/batch-trigger-ai-coach-calls/index.ts` | 修改 | 添加深夜陪伴触发逻辑 |
| `src/hooks/useAICoachIncomingCall.ts` | 修改 | 扩展类型和标签 |
| `src/components/coach-call/AIIncomingCallDialog.tsx` | 修改 | 深夜场景特殊UI |
| 数据库迁移 | 新建 | 添加 `last_seen_at` 字段和约束更新 |

---

### 触发条件总结

| 条件 | 阈值 |
|:-----|:-----|
| 时间窗口 | 22:00 - 01:00 |
| 用户活跃度 | 最近15分钟内有活动 |
| 情绪波动 | 近3天内 emotion_intensity ≥ 6 至少1次 |
| 点数余额 | remaining_quota ≥ 8 |
| 无重复来电 | 当前无进行中的AI来电 |

---

### 预期效果

**用户体验**：
- 深夜用户刷手机时，收到温柔的来电弹窗
- 看到 🌙 深夜陪伴 + "深夜了，想陪你聊聊"
- 接听后 AI 说："嘿，这么晚还没睡呀？感觉你最近心情有些起伏，想聊聊吗？"

**情感连接**：
- 在用户最脆弱的时刻提供陪伴
- 主动关怀而非被动等待
- 建立"有人在乎我"的情感体验

