
# AI情绪教练转化体验优化方案

## 问题诊断

### 根本原因

| 问题 | 原因分析 |
|------|----------|
| CTA过早出现 | `isConversionStage = userMessageCount >= 4`，但计数包含了初始化的系统消息 |
| 转化生硬 | 固定显示CTA卡片，不管对话内容是否铺垫好 |
| 用户未感受价值 | 还没体验到AI教练的洞察力就被推销 |

### 截图分析

用户只发了2条消息：
1. "我需要马上让我的产品可以赚钱"
2. "就是在自媒体上可以变现，可是我确什么都不懂"

此时AI还在共情倾听阶段，但CTA已经出现 → 非常突兀

## 优化方案

### 核心理念：先给价值，再温柔转化

```text
当前体验：
用户发2-3条 → 直接显示CTA卡片 → 用户感到被推销

优化后体验：
用户发6+条 → AI在对话中自然引出建议 → 轻量CTA辅助 → 用户感到被理解后愿意尝试
```

### 1. 延长对话深度，提高转化阈值

**文件：`src/components/emotion-health/AssessmentCoachChat.tsx`**

```typescript
// 修改前（第43行）：
const isConversionStage = userMessageCount >= 4;

// 修改后：
// 只计算真正的用户消息（排除以[系统：开头的初始化消息）
const realUserMessages = messages.filter(m => 
  m.role === 'user' && !m.content.startsWith('[系统：')
).length;

// 至少6轮真实对话后才考虑转化
const isConversionStage = realUserMessages >= 6;
```

### 2. 让AI在对话中自然引出训练营

**文件：`supabase/functions/assessment-coach-chat/index.ts`**

调整阶段逻辑，确保用户经历完整的觉察过程：

```typescript
// 修改阶段判断逻辑
function determineStage(messageCount: number): Stage {
  // 排除系统初始化消息后的真实用户消息数
  if (messageCount <= 3) return 'empathy';      // 前3轮：深度共情倾听
  if (messageCount <= 5) return 'awareness';    // 4-5轮：引导觉察
  if (messageCount <= 7) return 'action';       // 6-7轮：微行动体验
  return 'conversion';                          // 8轮+：自然转化
}
```

### 3. 让CTA更柔和，融入对话

**修改CTA渲染逻辑**：

```typescript
// 不再使用固定卡片，而是在对话足够深入后显示轻量引导
{isConversionStage && messages.length > 0 && !isLoading && (
  <div className="mt-6 px-4">
    {/* 分隔线，表示对话阶段转换 */}
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">💡 下一步建议</span>
      <div className="h-px flex-1 bg-border" />
    </div>
    
    {/* 柔和的推荐卡片 */}
    <Card className="p-4 bg-gradient-to-br from-rose-50 to-purple-50 dark:from-rose-900/10 dark:to-purple-900/10 border-rose-200 dark:border-rose-800">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📔</span>
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-1">21天情绪日记训练营</h4>
          <p className="text-xs text-muted-foreground mb-3">
            每天记录 + AI陪伴，帮你建立稳定的情绪觉察习惯
          </p>
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-rose-500 to-purple-500"
            onClick={() => handleCTAClick('camp')}
          >
            了解详情
          </Button>
        </div>
      </div>
    </Card>
    
    {/* 继续对话选项 */}
    <p className="text-xs text-center text-muted-foreground mt-3">
      或继续和我聊聊 ↓
    </p>
  </div>
)}
```

### 4. 移除价格显示

根据之前的反馈，CTA区域不应显示价格：

```typescript
// 移除这行：
// ¥299 · 每日AI陪伴 · 情绪日记打卡
```

## 对话阶段重新设计

| 阶段 | 用户消息数 | AI行为 | 目标 |
|------|-----------|--------|------|
| **共情倾听** | 1-3 | 真诚倾听、确认感受、邀请分享更多 | 建立信任 |
| **引导觉察** | 4-5 | 帮用户看到模式、正常化体验 | 产生洞察 |
| **微行动** | 6-7 | 给一个当下可做的小练习 | 体验价值 |
| **自然转化** | 8+ | AI在对话中提及训练营 + 显示轻量CTA | 自然引导 |

## 修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/components/emotion-health/AssessmentCoachChat.tsx` | 1. 修复用户消息计数逻辑<br>2. 提高转化阈值至6轮<br>3. 重新设计柔和的CTA样式<br>4. 移除价格显示 |
| `supabase/functions/assessment-coach-chat/index.ts` | 1. 调整阶段判断阈值<br>2. 优化转化阶段提示词，让AI自然引出建议 |

## 预期效果

- 用户至少经历6轮深度对话后才看到推荐
- AI在对话中自然提及训练营，而不是突然弹出卡片
- CTA设计更柔和，给用户"继续对话"的选择
- 不显示价格，降低销售压力
