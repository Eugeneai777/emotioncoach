

## 修复分享卡片分数与实际不一致的问题

### 问题原因

分享卡片中的"觉醒指数"始终显示 **68**，而实际结果页显示 **77**。原因是分享卡片组件使用了**硬编码默认值**，从未接收到真实数据：

```text
结果页流程：
  数据库查询 → 计算 totalScore → calculateHealthScore → 100 - healthScore = 77 ✓

分享卡片流程：
  未传入 healthScore → 使用默认值 68 ✗
```

具体代码问题：
- `AssessmentValueShareCard` 组件的 `healthScore` 参数默认值为 68，`reactionPattern` 默认值为"追逐型"
- `WealthInviteCardDialog` 渲染该组件时，没有传入 `healthScore` 和 `reactionPattern`，导致永远显示默认值

### 修复方案

#### 1. 在 WealthInviteCardDialog 中获取用户测评数据

**文件：** `src/components/wealth-camp/WealthInviteCardDialog.tsx`

在现有的 `fetchUserInfo` 函数中，增加一步查询 `wealth_block_assessments` 表，获取用户最近一次测评的三层分数和反应模式：

```typescript
// 查询最近一次测评数据
const { data: assessment } = await supabase
  .from('wealth_block_assessments')
  .select('behavior_score, emotion_score, belief_score, reaction_pattern')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

然后计算觉醒指数（与结果页使用完全相同的公式）：

```text
totalScore = behavior_score + emotion_score + belief_score
healthScore = Math.round((totalScore / 150) * 100)   // 卡点分（越低越好）
awakeningScore = 100 - healthScore                     // 觉醒指数（越高越好）
```

#### 2. 将真实数据传入分享卡片

将计算后的 `awakeningScore` 和 `reaction_pattern` 传入 `AssessmentValueShareCard`：

```tsx
<AssessmentValueShareCard 
  ref={valueCardRef}
  avatarUrl={userInfo.avatarUrl}
  displayName={userInfo.displayName}
  partnerInfo={partnerInfo || undefined}
  healthScore={assessmentData.awakeningScore}    // 真实觉醒指数
  reactionPattern={assessmentData.reactionPattern} // 真实反应模式
/>
```

#### 3. 新增 state 存储测评数据

在组件中新增状态：

```typescript
const [assessmentData, setAssessmentData] = useState<{
  awakeningScore: number;
  reactionPattern: string;
} | null>(null);
```

### 文件变更总表

| 文件 | 操作 |
|------|------|
| `src/components/wealth-camp/WealthInviteCardDialog.tsx` | 修改 - 获取真实测评数据并传入分享卡片 |

