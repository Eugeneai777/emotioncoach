

## 为AI主动来电添加"待办事项提醒"场景

### 需求概述

**目标**：通过AI来电帮助用户管理每日待办事项，形成「记录-提醒-完成-总结」的闭环。

**核心流程**：
1. **早晨 8:00**：AI来电引导用户口述今日待办事项，记录到数据库
2. **中午 12:30**：AI来电提醒进度，询问完成情况，更新状态
3. **晚上 21:00**：AI来电回顾今日待办，生成AI总结，提醒拖延项目

**数据展示**：
- 在日记/觉察系统中以待办事项卡片展示
- 用户可在日记页面直接打勾标记完成
- 每日生成AI待办总结

---

### 技术方案

#### 第一步：数据库设计

**1.1 创建 daily_todos 表**

```sql
CREATE TABLE IF NOT EXISTS public.daily_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium', -- 'high' | 'medium' | 'low'
  estimated_time INTEGER, -- 预估分钟数
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'ai_call', -- 'ai_call' | 'manual' | 'voice'
  call_id UUID REFERENCES ai_coach_calls(id), -- 关联来电记录
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_daily_todos_user_date ON public.daily_todos(user_id, date);

-- RLS
ALTER TABLE public.daily_todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own todos" ON public.daily_todos
  FOR ALL USING (auth.uid() = user_id);
```

**1.2 创建 daily_todo_summaries 表**

```sql
CREATE TABLE IF NOT EXISTS public.daily_todo_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  completion_rate NUMERIC(5,2),
  overdue_items JSONB, -- 拖延项目列表
  ai_summary TEXT, -- AI生成的每日总结
  insights TEXT, -- 分析洞察
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- RLS
ALTER TABLE public.daily_todo_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own summaries" ON public.daily_todo_summaries
  FOR ALL USING (auth.uid() = user_id);
```

**1.3 扩展 ai_coach_calls 场景**

```sql
ALTER TABLE public.ai_coach_calls 
DROP CONSTRAINT IF EXISTS ai_coach_calls_scenario_check;

ALTER TABLE public.ai_coach_calls 
ADD CONSTRAINT ai_coach_calls_scenario_check 
CHECK (scenario IN (
  'care', 'reminder', 'reactivation', 'camp_followup', 
  'emotion_check', 'late_night_companion', 'gratitude_reminder',
  'todo_morning', 'todo_noon', 'todo_evening'
));
```

**1.4 扩展 profiles 表的 ai_call_preferences**

```sql
-- 更新默认值包含待办提醒
COMMENT ON COLUMN public.profiles.ai_call_preferences IS 
'AI来电偏好设置，支持 todo_reminder 场景';
```

---

#### 第二步：更新 Edge Functions

**2.1 更新 `initiate-ai-call/index.ts`**

| 修改项 | 内容 |
|:-------|:-----|
| 类型定义 | 添加 `'todo_morning'`, `'todo_noon'`, `'todo_evening'` |
| SCENARIO_PROMPTS | 添加三个时段专属提示词 |
| getDefaultMessage | 添加待办提醒默认消息 |

```typescript
// 新增场景类型
scenario: 'care' | 'reminder' | ... | 'todo_morning' | 'todo_noon' | 'todo_evening';

// 新增场景提示词
todo_morning: '生成一句温暖的早晨开场白，邀请用户规划今天的待办事项，语气积极向上。',
todo_noon: '生成一句轻松的午间问候，询问用户上午的待办进展，鼓励继续加油。',
todo_evening: '生成一句温柔的晚间问候，帮助用户回顾今日待办，关心拖延项目。',

// 默认消息
todo_morning: `早安${name}！新的一天，想帮你规划一下今天要做的事～`,
todo_noon: `${name}，午间小憩时间，上午的事情进展如何？`,
todo_evening: `${name}，今天辛苦了！我们一起回顾下今天的待办吧～`,
```

**2.2 更新 `batch-trigger-ai-coach-calls/index.ts`**

添加待办提醒触发逻辑：

```typescript
// 待办提醒场景（每天3次：8:00, 12:30, 21:00）
const isTodoTime = (h: number, m: number) => {
  return (h === 8 && m < 30) || (h === 12 && m >= 30 && m < 60) || (h === 21 && m < 30);
};

const getTodoScenario = (h: number, m: number): 'todo_morning' | 'todo_noon' | 'todo_evening' | null => {
  if (h === 8 && m < 30) return 'todo_morning';
  if (h === 12 && m >= 30 && m < 60) return 'todo_noon';
  if (h === 21 && m < 30) return 'todo_evening';
  return null;
};

if (scenario?.startsWith('todo_') || (!scenario && isTodoTime(hour, minute))) {
  const currentScenario = getTodoScenario(hour, minute);
  
  if (currentScenario) {
    // 获取活跃用户（最近7天有活动的用户）
    const { data: activeUsers } = await supabase
      .from('profiles')
      .select('id')
      .gte('last_seen_at', sevenDaysAgo)
      .limit(limit);
    
    for (const user of activeUsers || []) {
      // 检查用户偏好
      const isEnabled = await checkUserCallPreference(supabase, user.id, 'todo_reminder');
      if (!isEnabled) continue;
      
      // 检查今天该时段是否已来电
      const { data: existingCalls } = await supabase
        .from('ai_coach_calls')
        .select('id')
        .eq('user_id', user.id)
        .eq('scenario', currentScenario)
        .gte('created_at', todayStart)
        .limit(1);
      
      if (existingCalls && existingCalls.length > 0) continue;
      
      // 触发待办提醒来电
      await supabase.functions.invoke('initiate-ai-call', {
        body: {
          user_id: user.id,
          scenario: currentScenario,
          coach_type: 'vibrant_life',
          context: {
            time_slot: currentScenario.replace('todo_', ''),
            // 早晨无context，中午/晚上携带待办数据
            ...(currentScenario !== 'todo_morning' && {
              pending_todos: await getTodayPendingTodos(supabase, user.id)
            })
          },
        },
      });
    }
  }
}
```

**2.3 创建 `save-daily-todo/index.ts`**

保存AI来电中记录的待办事项：

```typescript
serve(async (req) => {
  // 验证用户
  const { user } = await supabase.auth.getUser();
  
  const { todos, call_id } = await req.json();
  // todos: [{ title: string, priority?: string, estimated_time?: number }]
  
  const today = new Date().toISOString().split('T')[0];
  
  const insertData = todos.map(todo => ({
    user_id: user.id,
    date: today,
    title: todo.title,
    priority: todo.priority || 'medium',
    estimated_time: todo.estimated_time,
    source: 'ai_call',
    call_id,
  }));
  
  await supabase.from('daily_todos').insert(insertData);
  
  return Response.json({ success: true, count: todos.length });
});
```

**2.4 创建 `generate-daily-todo-summary/index.ts`**

晚间生成每日待办总结：

```typescript
serve(async (req) => {
  const { user_id, date } = await req.json();
  
  // 获取当日所有待办
  const { data: todos } = await supabase
    .from('daily_todos')
    .select('*')
    .eq('user_id', user_id)
    .eq('date', date);
  
  const totalCount = todos?.length || 0;
  const completedCount = todos?.filter(t => t.completed).length || 0;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const overdueItems = todos?.filter(t => !t.completed).map(t => ({
    title: t.title,
    priority: t.priority,
  }));
  
  // 使用AI生成总结
  const aiSummary = await generateAISummary(todos, completionRate, overdueItems);
  
  // 保存总结
  await supabase.from('daily_todo_summaries').upsert({
    user_id,
    date,
    total_count: totalCount,
    completed_count: completedCount,
    completion_rate: completionRate,
    overdue_items: overdueItems,
    ai_summary: aiSummary,
  });
  
  return Response.json({ success: true, summary: aiSummary });
});
```

---

#### 第三步：更新语音对话工具调用

**3.1 更新 `vibrant-life-realtime-token/index.ts`**

在语音对话的 tools 配置中添加待办事项相关工具：

```typescript
const todoTools = [
  {
    type: "function",
    function: {
      name: "record_todos",
      description: "记录用户口述的待办事项列表",
      parameters: {
        type: "object",
        properties: {
          todos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "待办事项标题" },
                priority: { 
                  type: "string", 
                  enum: ["high", "medium", "low"],
                  description: "优先级"
                },
                estimated_time: { 
                  type: "integer", 
                  description: "预估所需分钟数" 
                }
              },
              required: ["title"]
            }
          }
        },
        required: ["todos"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_todo_status",
      description: "更新待办事项完成状态",
      parameters: {
        type: "object",
        properties: {
          todo_id: { type: "string" },
          completed: { type: "boolean" }
        },
        required: ["todo_id", "completed"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_todo_summary",
      description: "生成每日待办总结，包括完成率和拖延项目分析",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "今日总结" },
          overdue_analysis: { type: "string", description: "拖延原因分析" },
          tomorrow_suggestion: { type: "string", description: "明日建议" }
        },
        required: ["summary"]
      }
    }
  }
];
```

---

#### 第四步：前端组件开发

**4.1 创建 `DailyTodoCard.tsx`**

在日记页面展示待办事项的卡片组件：

```tsx
interface DailyTodoCardProps {
  date: string;
  todos: DailyTodo[];
  onToggle: (id: string, completed: boolean) => void;
}

export function DailyTodoCard({ date, todos, onToggle }: DailyTodoCardProps) {
  const completedCount = todos.filter(t => t.completed).length;
  const completionRate = todos.length > 0 
    ? Math.round((completedCount / todos.length) * 100) 
    : 0;
  
  return (
    <Card className="border-blue-200/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            今日待办
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{todos.length} ({completionRate}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {todos.map(todo => (
          <div 
            key={todo.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-all",
              todo.completed && "bg-emerald-50 dark:bg-emerald-950/20"
            )}
          >
            <Checkbox
              checked={todo.completed}
              onCheckedChange={(checked) => onToggle(todo.id, !!checked)}
            />
            <div className="flex-1">
              <span className={cn(
                "text-sm",
                todo.completed && "line-through text-muted-foreground"
              )}>
                {todo.title}
              </span>
              {todo.priority === 'high' && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  优先
                </Badge>
              )}
            </div>
            {todo.estimated_time && (
              <span className="text-xs text-muted-foreground">
                ~{todo.estimated_time}分钟
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

**4.2 创建 `useDailyTodos.ts` Hook**

```tsx
export function useDailyTodos(date?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['daily-todos', user?.id, targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_todos')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', targetDate)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
  
  const toggleTodo = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('daily_todos')
        .update({ 
          completed, 
          completed_at: completed ? new Date().toISOString() : null 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-todos'] });
    },
  });
  
  return { todos, isLoading, toggleTodo };
}
```

**4.3 更新 `AwakeningJournal.tsx`**

在觉察日记页面中集成待办事项卡片：

```tsx
// 在页面顶部添加今日待办卡片
<DailyTodoCard
  date={today}
  todos={todayTodos}
  onToggle={(id, completed) => toggleTodo.mutate({ id, completed })}
/>
```

**4.4 更新 `AICallPreferences.tsx`**

添加待办提醒的偏好开关：

```tsx
const scenarios = [
  // ...existing scenarios
  { key: 'todo_reminder' as const, label: '待办提醒', description: '每天3次帮你规划和回顾待办', icon: '✅' },
];

const todoTimeSlots = [
  { key: 'morning' as const, label: '早晨 8:00', description: '规划今日待办' },
  { key: 'noon' as const, label: '中午 12:30', description: '检查进度' },
  { key: 'evening' as const, label: '晚上 21:00', description: '回顾总结' },
];

// 在感恩提醒时段下方添加待办提醒时段配置
```

**4.5 更新 `useAICoachIncomingCall.ts`**

```typescript
scenario: 'care' | 'reminder' | ... | 'todo_morning' | 'todo_noon' | 'todo_evening';

const SCENARIO_LABELS = {
  // ...existing
  todo_morning: '帮你规划今天的待办事项',
  todo_noon: '看看上午进展如何',
  todo_evening: '一起回顾今天的待办',
};
```

**4.6 更新 `AIIncomingCallDialog.tsx`**

```typescript
const COACH_INFO = {
  // ...existing
  todo_reminder: { 
    name: '待办助手', 
    emoji: '✅', 
    color: 'from-blue-400 to-cyan-500' 
  },
};
```

---

### 涉及文件清单

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| 数据库迁移 | 新建 | 创建 daily_todos, daily_todo_summaries 表 |
| `supabase/functions/initiate-ai-call/index.ts` | 修改 | 添加 todo_* 场景 |
| `supabase/functions/batch-trigger-ai-coach-calls/index.ts` | 修改 | 添加待办提醒触发逻辑 |
| `supabase/functions/save-daily-todo/index.ts` | 新建 | 保存待办事项 |
| `supabase/functions/generate-daily-todo-summary/index.ts` | 新建 | 生成每日总结 |
| `supabase/functions/vibrant-life-realtime-token/index.ts` | 修改 | 添加待办工具调用 |
| `src/components/todo/DailyTodoCard.tsx` | 新建 | 待办事项展示卡片 |
| `src/hooks/useDailyTodos.ts` | 新建 | 待办数据管理Hook |
| `src/pages/AwakeningJournal.tsx` | 修改 | 集成待办卡片 |
| `src/components/AICallPreferences.tsx` | 修改 | 添加待办提醒偏好 |
| `src/hooks/useAICoachIncomingCall.ts` | 修改 | 扩展场景类型 |
| `src/components/coach-call/AIIncomingCallDialog.tsx` | 修改 | 添加待办助手UI |

---

### 用户体验流程

**早晨 8:00**
```text
用户收到AI来电 ✅
     ↓
看到「待办助手」+ "帮你规划今天的待办事项"
     ↓
接听后 AI："早安！今天有什么想完成的事吗？"
     ↓
用户口述：买菜、看书30分钟、给妈妈打电话...
     ↓
AI 解析并保存到 daily_todos 表
     ↓
AI："好的，我帮你记下了3件事。我会中午再来看看进展～"
```

**中午 12:30**
```text
AI来电：「看看上午进展如何」
     ↓
AI："午间小憩时间～上午的待办进展如何？买菜完成了吗？"
     ↓
用户："买菜完成了，看书还没开始"
     ↓
AI 更新完成状态，提供鼓励
```

**晚上 21:00**
```text
AI来电：「一起回顾今天的待办」
     ↓
AI："今天辛苦了！你完成了2件事，还有1件'看书'没完成，是什么原因呢？"
     ↓
用户分享原因
     ↓
AI 生成总结 + 拖延分析 + 明日建议
     ↓
保存到 daily_todo_summaries 表
```

**日记页面展示**
```text
用户进入觉察日记页面
     ↓
看到「今日待办」卡片
     ↓
显示待办列表 + 完成率进度条
     ↓
用户可直接打勾标记完成
     ↓
下方显示AI生成的每日总结
```

---

### 预期效果

**习惯养成**：
- 固定时间点的"规划-检查-回顾"节奏
- 语音交互降低记录门槛
- AI总结帮助用户反思拖延原因

**情感连接**：
- AI主动关心进度，建立"被关注"的感觉
- 分时段差异化开场白，体现理解用户的一天
- 拖延提醒温柔而不指责

**数据价值**：
- 长期待办数据可用于分析用户行为模式
- 结合情绪数据分析"什么情绪下完成率更高"
- 为用户提供个性化时间管理建议

