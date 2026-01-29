

## 为AI主动来电添加"通话中询问续拨"和"设置页配置"功能

### 需求分析

**核心需求**：
1. **对话中询问**：AI在通话结束前询问用户"是否继续接收来电"
2. **设置中配置**：用户可以在设置页开关各类AI来电提醒

**价值**：
- 让用户主动选择是否需要AI关怀
- 避免用户感到被打扰
- 提升用户对产品的掌控感

---

### 技术方案

#### 第一步：数据库扩展

**1.1 在 profiles 表添加AI来电偏好字段**

```sql
-- AI来电全局开关
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_call_enabled BOOLEAN DEFAULT true;

-- 各场景独立开关（JSONB 存储）
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_call_preferences JSONB DEFAULT '{
  "late_night_companion": true,
  "gratitude_reminder": true,
  "emotion_check": true,
  "reactivation": true,
  "camp_followup": true,
  "care": true
}'::jsonb;

-- 感恩提醒时段配置
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gratitude_reminder_slots JSONB DEFAULT '{
  "morning": true,
  "noon": true,
  "evening": true
}'::jsonb;
```

---

#### 第二步：更新 Edge Functions

**2.1 修改 `batch-trigger-ai-coach-calls/index.ts`**

在触发来电前检查用户偏好：

```typescript
// 检查用户是否启用了该场景的来电
const checkUserCallPreference = async (userId: string, scenario: string): Promise<boolean> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_call_enabled, ai_call_preferences, gratitude_reminder_slots')
    .eq('id', userId)
    .single();

  if (!profile) return false;
  
  // 全局开关
  if (profile.ai_call_enabled === false) return false;
  
  // 场景开关
  const preferences = profile.ai_call_preferences || {};
  if (preferences[scenario] === false) return false;
  
  return true;
};

// 在每个场景触发前调用
for (const userId of usersToProcess) {
  // 新增：检查用户偏好
  const isEnabled = await checkUserCallPreference(userId, 'gratitude_reminder');
  if (!isEnabled) {
    console.log(`User ${userId} has disabled ${scenario} calls`);
    continue;
  }
  
  // ...原有触发逻辑
}
```

**2.2 感恩提醒时段检查**

```typescript
// 检查感恩提醒的时段偏好
const checkGratitudeSlotPreference = async (userId: string, slot: 'morning' | 'noon' | 'evening'): Promise<boolean> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('gratitude_reminder_slots')
    .eq('id', userId)
    .single();

  if (!profile) return true; // 默认开启
  
  const slots = profile.gratitude_reminder_slots || { morning: true, noon: true, evening: true };
  return slots[slot] !== false;
};
```

---

#### 第三步：通话中询问续拨意愿

**3.1 更新 `CoachVoiceChat.tsx` - 在通话结束前询问**

在 `endCall` 函数中，如果是AI主动来电（`isIncomingCall === true`），弹出询问弹窗：

```typescript
// 新增状态
const [showContinueCallDialog, setShowContinueCallDialog] = useState(false);

// 修改 endCall 逻辑
const endCall = async (e?: React.MouseEvent) => {
  // ...原有逻辑...
  
  // 如果是AI主动来电，在结束前询问是否继续接收
  if (isIncomingCall && aiCallId && durationValueRef.current > 30) { // 通话超过30秒才询问
    setShowContinueCallDialog(true);
    return; // 暂停结束流程，等待用户选择
  }
  
  // ...原有结束逻辑...
};

// 用户选择后的处理
const handleContinueChoice = async (wantMore: boolean) => {
  if (!wantMore) {
    // 用户选择不再接收该场景来电
    await updateCallPreference(false);
  }
  setShowContinueCallDialog(false);
  // 继续结束通话
  await performEndCall();
};
```

**3.2 新建 `ContinueCallDialog.tsx` 组件**

```tsx
interface ContinueCallDialogProps {
  isOpen: boolean;
  scenario: string;
  onChoice: (wantMore: boolean) => void;
}

export function ContinueCallDialog({ isOpen, scenario, onChoice }: ContinueCallDialogProps) {
  const scenarioLabels = {
    late_night_companion: '深夜陪伴',
    gratitude_reminder: '感恩提醒',
    emotion_check: '情绪关怀',
    // ...
  };
  
  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>这次通话有帮助吗？</DialogTitle>
          <DialogDescription>
            你希望继续接收「{scenarioLabels[scenario]}」来电吗？
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => onChoice(false)}>
            暂时不需要了
          </Button>
          <Button onClick={() => onChoice(true)}>
            继续提醒我 💚
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

#### 第四步：设置页添加AI来电偏好配置

**4.1 新建 `AICallPreferences.tsx` 组件**

在 `SmartNotificationPreferences.tsx` 同级目录新建：

```tsx
export function AICallPreferences() {
  const [loading, setLoading] = useState(true);
  const [aiCallEnabled, setAiCallEnabled] = useState(true);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [gratitudeSlots, setGratitudeSlots] = useState<Record<string, boolean>>({});

  // 场景配置
  const scenarios = [
    { key: 'gratitude_reminder', label: '感恩提醒', description: '每天3次提醒记录感恩事项', icon: '🌸' },
    { key: 'late_night_companion', label: '深夜陪伴', description: '深夜检测到活跃时关心你', icon: '🌙' },
    { key: 'emotion_check', label: '情绪关怀', description: '检测到情绪波动时主动联系', icon: '💚' },
    { key: 'reactivation', label: '久未联系', description: '7天未使用时温柔提醒', icon: '👋' },
    { key: 'camp_followup', label: '训练营提醒', description: '训练营任务未完成时提醒', icon: '🏕️' },
  ];

  const gratitudeTimeSlots = [
    { key: 'morning', label: '早晨 8:00', description: '开启新的一天' },
    { key: 'noon', label: '中午 12:30', description: '回顾上午的小确幸' },
    { key: 'evening', label: '晚上 21:00', description: '睡前感恩回顾' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          AI教练来电设置
        </CardTitle>
        <CardDescription>
          AI教练会在合适的时机主动来电关心你
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 全局开关 */}
        <div className="flex items-center justify-between">
          <div>
            <Label>启用AI主动来电</Label>
            <p className="text-sm text-muted-foreground">关闭后不再接收任何AI来电</p>
          </div>
          <Switch checked={aiCallEnabled} onCheckedChange={handleGlobalToggle} />
        </div>

        {aiCallEnabled && (
          <>
            <Separator />
            
            {/* 各场景开关 */}
            {scenarios.map(scenario => (
              <div key={scenario.key} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{scenario.icon}</span>
                  <div>
                    <Label>{scenario.label}</Label>
                    <p className="text-xs text-muted-foreground">{scenario.description}</p>
                  </div>
                </div>
                <Switch 
                  checked={preferences[scenario.key] !== false} 
                  onCheckedChange={(v) => handleScenarioToggle(scenario.key, v)} 
                />
              </div>
            ))}

            {/* 感恩提醒时段配置 */}
            {preferences.gratitude_reminder !== false && (
              <div className="pl-8 space-y-3 border-l-2 border-rose-200">
                <p className="text-sm font-medium text-rose-600">感恩提醒时段</p>
                {gratitudeTimeSlots.map(slot => (
                  <div key={slot.key} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm">{slot.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{slot.description}</span>
                    </div>
                    <Switch 
                      checked={gratitudeSlots[slot.key] !== false} 
                      onCheckedChange={(v) => handleSlotToggle(slot.key, v)} 
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

**4.2 在 `SmartNotificationPreferences.tsx` 中集成**

在现有的通知偏好卡片后添加 AI 来电偏好组件：

```tsx
// 在微信公众号模板消息卡片后添加
<AICallPreferences />
```

---

### 涉及文件清单

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| 数据库迁移 | 新建 | 添加 ai_call_enabled, ai_call_preferences, gratitude_reminder_slots 字段 |
| `src/components/AICallPreferences.tsx` | 新建 | AI来电偏好设置组件 |
| `src/components/coach/ContinueCallDialog.tsx` | 新建 | 通话结束询问续拨弹窗 |
| `src/components/coach/CoachVoiceChat.tsx` | 修改 | 在AI来电结束时弹出询问 |
| `src/components/SmartNotificationPreferences.tsx` | 修改 | 集成 AICallPreferences 组件 |
| `supabase/functions/batch-trigger-ai-coach-calls/index.ts` | 修改 | 触发前检查用户偏好 |

---

### 用户体验流程

**场景A：通话中询问**
```text
用户接听深夜陪伴来电
     ↓
与AI对话 2-3 分钟
     ↓
用户点击挂断
     ↓
弹出询问弹窗：
"这次通话有帮助吗？是否继续接收深夜陪伴来电？"
     ↓
用户选择「继续提醒我」或「暂时不需要了」
     ↓
保存偏好，结束通话
```

**场景B：设置页配置**
```text
用户进入 设置 → 通知偏好
     ↓
看到「AI教练来电设置」卡片
     ↓
可开关全局来电
     ↓
可单独开关各场景（感恩提醒、深夜陪伴等）
     ↓
感恩提醒下可细化选择时段（早/中/晚）
```

---

### 预期效果

**用户体验**：
- 不再"被动接受"，而是"主动选择"
- 设置简洁直观，一目了然
- 通话中自然询问，不打断体验

**系统行为**：
- 触发来电前先检查用户偏好
- 用户关闭后不再触发对应场景
- 偏好数据实时生效

