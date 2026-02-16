

## 财富教练语音对话优化：免积分 + 提示词重写

### 两个修改点

### 1. 取消积分扣费

当前 `CoachVoiceChat` 每分钟扣 8 积分（`deduct-quota`），对于财富觉醒教练的 5 次免费通话不应扣费。

**文件：`src/components/wealth-block/AssessmentVoiceCoach.tsx`**

给 `CoachVoiceChat` 传入 `featureKey=""` 或新增一个 `skipBilling` prop。更简洁的方案：将 `featureKey` 设为空字符串，`CoachVoiceChat` 内部在 `checkQuota` 和 `deductQuota` 流程中对空 featureKey 跳过扣费。

实际上更直接的做法：在 `CoachVoiceChat` 中增加 `skipBilling?: boolean` prop：
- 当 `skipBilling=true` 时，跳过 `checkQuota`（直接返回 true）和 `deductQuota`（直接返回 true）
- 不显示积分/余额相关 UI

**文件：`src/components/coach/CoachVoiceChat.tsx`**
- Props 增加 `skipBilling?: boolean`
- `checkQuota` 函数开头：若 `skipBilling` 则直接设 `isCheckingQuota=false` 并返回 true
- `deductQuota` 函数开头：若 `skipBilling` 则直接返回 true
- 底部余额显示区域：若 `skipBilling` 则隐藏

**文件：`src/components/wealth-block/AssessmentVoiceCoach.tsx`**
- 传入 `skipBilling={true}`

### 2. 重写提示词：更共情、先了解需求

**文件：`supabase/functions/wealth-assessment-realtime-token/index.ts`**

重写 `buildWealthCoachInstructions` 函数，核心变化：

- **开场**：不再直接讲解测评结果，而是先好奇地询问用户"是什么让你想做这个测评？最近在财富上有什么困惑或烦恼？"
- **倾听阶段**：深入了解用户的需求和痛点，追问具体场景和感受
- **共情连接**：将用户分享的困惑与测评结果自然关联，给予充分的同理心和鼓励
- **启发引导**：提供有温度和启发性的回应，帮用户看见改变的可能性
- **自然转化**：在充分共情和建立信任后，自然引导用户了解训练营

新的对话流程：

```text
第1轮 - 好奇倾听：
  "你好呀！我是劲老师💎 很开心你做了这个财富卡点测评。
   我很好奇，是什么让你想来做这个测评呢？
   最近在财富或者金钱方面，有什么困扰你的事情吗？"

第2轮 - 深入了解：
  基于用户分享，追问具体场景和感受
  "能跟我多说说吗？比如最近有没有什么具体的事让你特别焦虑/纠结？"

第3轮 - 共情 + 测评关联：
  将用户的痛点与测评数据关联
  "你说的这些，我特别能理解...其实你的测评结果也印证了这一点..."
  给予鼓励："能意识到这些，本身就是很大的一步"

第4轮 - 启发洞察：
  帮用户看见模式背后的根因
  提供有温度的解读，让用户感到"被看见"

第5轮 - 训练营引导：
  自然过渡到训练营作为持续成长的路径
```

核心原则修改：
- 删除固定的开场白脚本，改为灵活的引导框架
- 强调"先倾听、再共情、后引导"的顺序
- 每轮回复更简短（2-3句），更多留空间给用户
- 语气更温暖、更像朋友聊天

### 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `src/components/coach/CoachVoiceChat.tsx` | 增加 `skipBilling` prop，跳过积分检查和扣费 |
| `src/components/wealth-block/AssessmentVoiceCoach.tsx` | 传入 `skipBilling={true}` |
| `supabase/functions/wealth-assessment-realtime-token/index.ts` | 重写提示词：先了解需求、更共情、再关联测评、自然引导训练营 |
