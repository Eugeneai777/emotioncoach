

## 确保AI主动来电正确扣费

### 当前分析

**现有计费流程：**

```text
AI来电触发 (initiate-ai-call)
     ↓
检查余额 ≥ 8 点 → 否则不拨打
     ↓
用户接听 → 导航到教练页面
     ↓
CoachVoiceChat 挂载
     ↓
startCall() → deductQuota(1) 预扣第一分钟 8 点
     ↓
每分钟 deductQuota(currentMinute) 按分钟扣费
```

**结论：当前代码已正确扣费**

- `initiate-ai-call` 在发起来电前检查用户余额 ≥ 8 点
- 用户接听后，`CoachVoiceChat` 组件的 `startCall()` 会预扣第一分钟点数
- 后续按分钟持续扣费，与用户主动发起的通话使用相同逻辑

---

### 潜在问题与优化建议

虽然核心扣费逻辑正确，但存在以下可优化点：

| 问题 | 风险 | 建议 |
|:-----|:-----|:-----|
| 无来电专属日志 | 无法区分主动/被动来电的计费统计 | 在扣费 metadata 中添加 `is_incoming_call` 标记 |
| 无来电账单记录 | 用户无法查看AI来电消耗明细 | 在 `ai_coach_calls` 表增加 `points_consumed` 字段 |
| 拒接/未接无记录 | 无法分析用户响应率 | 保持现状（已在 `call_status` 中记录） |

---

### 实施方案

#### 第一步：增强扣费日志标记

**修改 `CoachVoiceChat.tsx` 的 `deductQuota` 函数**

在扣费请求的 metadata 中添加 AI 来电标识：

```typescript
const { data, error } = await supabase.functions.invoke('deduct-quota', {
  body: {
    feature_key: featureKey,
    source: 'voice_chat',
    amount: POINTS_PER_MINUTE,
    metadata: {
      minute,
      session_id: sessionIdRef.current,
      coach_key: coachTitle,
      cost_per_minute: POINTS_PER_MINUTE,
      // 🆕 新增：AI来电标记
      is_incoming_call: isIncomingCall,
      ai_call_id: aiCallId || null,
    }
  }
});
```

#### 第二步：记录来电消耗点数

**修改 `performEndCall` 函数**

在 AI 来电结束时，更新 `ai_coach_calls` 表记录消耗的点数：

```typescript
// performEndCall 中的 AI 来电状态更新逻辑
if (aiCallId) {
  const pointsConsumed = lastBilledMinuteRef.current * POINTS_PER_MINUTE;
  await supabase
    .from('ai_coach_calls')
    .update({
      call_status: 'completed',
      ended_at: new Date().toISOString(),
      points_consumed: pointsConsumed,  // 🆕 新增
      duration_seconds: durationValueRef.current,  // 🆕 新增
    })
    .eq('id', aiCallId);
}
```

#### 第三步：数据库扩展

**添加 `ai_coach_calls` 表字段**

```sql
ALTER TABLE public.ai_coach_calls 
ADD COLUMN IF NOT EXISTS points_consumed INTEGER DEFAULT 0;

ALTER TABLE public.ai_coach_calls 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
```

---

### 涉及文件

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| 数据库迁移 | 新建 | 添加 `points_consumed`, `duration_seconds` 字段 |
| `src/components/coach/CoachVoiceChat.tsx` | 修改 | 在 deductQuota 中添加 AI 来电标记，在结束时记录消耗 |

---

### 技术说明

**为什么 AI 来电已经正确扣费？**

1. AI 来电触发后，用户接听会导航到教练页面（如 `/coach/vibrant_life_sage`）
2. 教练页面挂载 `CoachVoiceChat` 组件
3. 组件的 `startCall()` 在连接语音前会调用 `deductQuota(1)` 预扣第一分钟
4. 连接成功后，每过一分钟会调用 `deductQuota(currentMinute)` 继续扣费
5. AI 来电和用户主动通话使用**完全相同**的扣费逻辑

**本次优化的价值：**

- 便于后台统计 AI 来电的成本和用户响应率
- 用户可在历史记录中看到每次 AI 来电消耗的点数
- 为后续的来电分析报表提供数据基础

