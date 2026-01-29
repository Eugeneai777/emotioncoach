

## 让用户随时能收到AI来电的完整方案

### 问题诊断

当前AI来电系统有两个核心问题：

1. **没有定时任务触发**：`batch-trigger-ai-coach-calls` 函数虽然写好了，但没有在 `cron.job` 中配置定时任务来调用它
2. **固定时间窗口限制**：所有场景都绑定到特定时间点（如8:00、12:30、21:00），用户必须在这些时间点才可能收到来电

### 解决方案

#### 第一步：添加Cron定时任务

在数据库中创建定时任务，每15分钟触发一次批量检查：

```sql
SELECT cron.schedule(
  'batch-trigger-ai-coach-calls',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/batch-trigger-ai-coach-calls',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <anon_key>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

这会让系统每15分钟检查一次是否有符合条件的用户需要收到来电。

#### 第二步：创建「智能伴随」场景

添加一个新的AI来电场景，基于**用户行为实时触发**，而不是固定时间点：

**触发条件（满足任一即可）**：
- 用户在应用内活跃超过5分钟且未开始对话
- 用户浏览了某个功能页面但没有使用
- 用户情绪波动（记录后15分钟关怀）
- 用户完成了一个任务（即时鼓励）

**技术实现**：

| 组件 | 作用 |
|:-----|:-----|
| 新建 `smart_companion` 场景 | 智能伴随来电 |
| 扩展 `batch-trigger-ai-coach-calls` | 添加活跃用户检测逻辑 |
| 前端活跃度追踪 | 上报用户行为数据 |

#### 第三步：扩展时间窗口

将固定时间点改为**时间范围**，增加触发概率：

```text
原来：8:00 精确触发
改为：7:30-9:00 随机触发（30分钟内随机选择时间）

原来：12:30 精确触发  
改为：11:30-13:30 随机触发

原来：21:00 精确触发
改为：20:30-22:00 随机触发
```

这样用户不会每天在完全相同的时间收到来电，体验更自然。

#### 第四步：添加「空闲时段」检测

**用户活跃度计算**：
```typescript
// 判断用户当前是否处于"可接听"状态
const isUserAvailable = (lastSeenAt: Date) => {
  const now = new Date();
  const minutesSinceLastSeen = (now.getTime() - lastSeenAt.getTime()) / 60000;
  
  // 1-5分钟内活跃 = 正在使用，适合来电
  // 5-30分钟内活跃 = 可能还在附近
  // 超过30分钟 = 可能离开了
  return minutesSinceLastSeen >= 1 && minutesSinceLastSeen <= 30;
};
```

---

### 实施方案

#### 涉及文件

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| 数据库 Cron 任务 | 新建 | 添加每15分钟触发的定时任务 |
| `supabase/functions/batch-trigger-ai-coach-calls/index.ts` | 修改 | 扩展时间窗口、添加智能伴随场景 |
| `supabase/functions/initiate-ai-call/index.ts` | 修改 | 添加 `smart_companion` 场景提示词 |
| `src/hooks/useAICoachIncomingCall.ts` | 修改 | 添加新场景映射 |
| `src/components/coach-call/AIIncomingCallDialog.tsx` | 修改 | 添加新场景UI |
| `src/components/AICallPreferences.tsx` | 修改 | 添加智能伴随开关 |

#### 数据库变更

**1. 添加 Cron 定时任务**
```sql
SELECT cron.schedule(
  'batch-trigger-ai-coach-calls',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/batch-trigger-ai-coach-calls',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsc3V6c2t2eWtkZHdyeGJtY2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Mzg2NjQsImV4cCI6MjA3ODQxNDY2NH0.pYilMaNu2_EQvn4HrfIpAGxomkQCQCdPPLMq5NPv3pk"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

#### Edge Function 变更

**2. 扩展 `batch-trigger-ai-coach-calls` 添加智能伴随场景**

```typescript
// 智能伴随场景（每15分钟检查一次活跃用户）
if (scenario === 'smart_companion' || !scenario) {
  // 查找1-10分钟内活跃的用户
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  
  const { data: activeUsers } = await supabase
    .from('profiles')
    .select('id, display_name, last_seen_at')
    .gte('last_seen_at', tenMinutesAgo)
    .lt('last_seen_at', oneMinuteAgo)
    .limit(limit);
  
  if (activeUsers) {
    for (const user of activeUsers) {
      // 检查今天是否已经收到过智能伴随来电（每天最多1次）
      const { data: existingCalls } = await supabase
        .from('ai_coach_calls')
        .select('id')
        .eq('user_id', user.id)
        .eq('scenario', 'smart_companion')
        .gte('created_at', todayStart)
        .limit(1);
      
      if (existingCalls?.length > 0) continue;
      
      // 检查用户偏好
      const isEnabled = await checkUserCallPreference(supabase, user.id, 'smart_companion');
      if (!isEnabled) continue;
      
      // 触发智能伴随来电
      await supabase.functions.invoke('initiate-ai-call', {
        body: {
          user_id: user.id,
          scenario: 'smart_companion',
          coach_type: 'vibrant_life',
          context: { trigger_reason: 'active_without_interaction' },
        },
      });
    }
  }
}
```

**3. 扩展时间窗口逻辑**

将精确时间点改为时间范围：

```typescript
// 待办提醒：扩展时间窗口
const isTodoTime = (h: number, m: number) => {
  return (h >= 7 && h < 9) ||           // 早晨 7:00-9:00
         (h >= 11 && h < 14) ||          // 中午 11:00-14:00  
         (h >= 20 && h < 22);            // 晚上 20:00-22:00
};

// 添加随机延迟避免同一时间大量来电
const shouldTriggerNow = () => {
  // 15%概率触发（每15分钟检查一次，时间窗口2小时=8次机会）
  return Math.random() < 0.15;
};
```

---

### 预期效果

| 改进点 | 效果 |
|:-------|:-----|
| 添加 Cron 任务 | 系统每15分钟自动检查，无需人工触发 |
| 智能伴随场景 | 用户活跃时主动关怀，每天最多1次 |
| 扩展时间窗口 | 2小时范围内随机来电，体验更自然 |
| 随机触发概率 | 避免所有用户同时收到来电 |

### 用户可控性

在设置页面添加「智能伴随」开关，用户可以：
- 开启/关闭智能伴随来电
- 设置「勿扰时段」（如工作时间）
- 调整每日来电频率上限

