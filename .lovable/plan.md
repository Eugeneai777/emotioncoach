
# AI情绪教练对话优化方案

## 问题分析

### 1. 名称需统一修改
目前"AI情绪健康教练"在以下位置仍需改为"AI情绪教练"：

| 文件 | 位置 | 当前文案 |
|------|------|----------|
| `AssessmentCoachPage.tsx` | 第38行 title | "AI情绪健康教练 - 有劲AI" |
| `AssessmentCoachPage.tsx` | 第39行 meta | "根据你的情绪状态，开启专属的AI情绪健康教练对话" |
| `AssessmentCoachPage.tsx` | 第42行 PageHeader | "AI情绪健康教练" |
| `emotionHealthData.ts` | 第202行 | assessmentOutcomes 中的 "AI情绪健康教练" |
| `emotionHealthData.ts` | 第226行 | pricingIncludes 中的 "AI情绪健康教练" |
| `emotionHealthData.ts` | 第233行 | loginBenefits 中的 "获得AI情绪健康教练对话" |
| `growthPathConfig.ts` | 第38行 | description "基于测评结果的AI情绪健康教练" |

### 2. 一开始显示2条消息的原因

在 `AssessmentCoachChat.tsx` 第52-57行：

```typescript
useEffect(() => {
  if (messages.length === 0) {
    addAIMessage(1);
  }
}, []);
```

问题在于：
- React 18 的 Strict Mode 会在开发模式下执行两次 useEffect
- 或者组件意外重新渲染导致 useEffect 多次触发
- `messages.length === 0` 的检查没有阻止并发调用

### 3. 对话过于死板的问题

当前实现是**纯脚本驱动**的对话：
- 所有AI回复都是预设的静态文案（`coachDialogueScripts`）
- 用户输入实际上被忽略，只是触发下一轮预设内容
- 没有真正使用AI来理解和回应用户

## 优化方案

### 方案一：修复名称和双消息问题（立即可做）

**1. 统一名称修改**

| 文件 | 修改内容 |
|------|----------|
| `AssessmentCoachPage.tsx` | title、meta、PageHeader 改为 "AI情绪教练" |
| `emotionHealthData.ts` | 三处改为 "AI情绪教练" |
| `growthPathConfig.ts` | description 改为 "基于测评结果的AI情绪教练" |

**2. 修复双消息问题**

```typescript
// AssessmentCoachChat.tsx
const [initialized, setInitialized] = useState(false);

useEffect(() => {
  if (!initialized && messages.length === 0) {
    setInitialized(true);
    addAIMessage(1);
  }
}, [initialized, messages.length]);
```

### 方案二：对话智能化改造（需要较大改动）

将当前的脚本驱动改为**AI驱动 + 脚本引导**模式：

**架构改动**：

```text
当前流程：
用户输入 → 忽略内容 → 输出下一条预设文案

优化后流程：
用户输入 → 发送至AI Edge Function → AI基于阶段提示词生成回复 → 动态渲染
```

**核心改动**：

1. **创建 Edge Function**: `supabase/functions/assessment-coach-chat/index.ts`
   - 接收用户消息 + 当前阶段 + 用户测评结果
   - 使用阶段性系统提示词控制对话方向
   - 调用 Lovable AI Gateway 生成智能回复

2. **阶段性提示词设计**：
   - Round 1-2: 共情倾听阶段，AI需要真正理解用户困境
   - Round 3-4: 引导觉察阶段，基于用户回答给出个性化解读
   - Round 5-7: 转化阶段，自然推荐21天情绪日记训练营

3. **改造前端组件**：
   - 使用 streaming 实时显示AI回复
   - 保留选项按钮作为快捷输入
   - 动态判断何时展示训练营CTA

**Edge Function 核心逻辑示例**：

```typescript
// 阶段提示词
const stagePrompts = {
  empathy: `你是一位温暖的情绪教练，用户刚完成测评，处于"${pattern}"模式。
    在这个阶段：
    - 倾听并共情用户的困扰
    - 不要急于给建议
    - 用简短的反馈确认你理解了他们
    - 用一个开放问题邀请他们继续分享`,
  
  awareness: `用户已经分享了一些困扰，现在进入觉察引导阶段。
    - 帮助用户看到行为模式背后的心理机制
    - 正常化他们的体验
    - 提供一个简单的当下练习`,
  
  conversion: `用户已经体验了一轮对话，现在自然地过渡到推荐阶段。
    - 肯定他们今天的投入
    - 说明持续陪伴比单次对话更有效
    - 自然引出"21天情绪日记训练营"（¥299），强调每日AI陪伴和打卡
    - 不要强推，给用户选择空间`
};
```

**前端改造**：

```typescript
// 使用真实AI对话替代脚本
const handleSend = async () => {
  if (!input.trim() || isLoading) return;
  
  const userMessage = { role: 'user', content: input.trim() };
  setMessages(prev => [...prev, userMessage]);
  setInput("");
  setIsLoading(true);

  // 流式调用AI
  await streamChat({
    messages: [...messages, userMessage],
    stage: currentStage,
    pattern: pattern,
    onDelta: (chunk) => {
      // 实时更新AI回复
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
        }
        return [...prev, { role: 'assistant', content: chunk }];
      });
    },
    onDone: () => {
      setIsLoading(false);
      advanceStage(); // 根据对话进度推进阶段
    }
  });
};
```

## 推荐实施步骤

| 阶段 | 内容 | 工作量 |
|------|------|--------|
| Phase 1 | 修复名称 + 双消息问题 | 小 |
| Phase 2 | 创建 AI Edge Function + 阶段提示词 | 中 |
| Phase 3 | 改造前端支持流式对话 | 中 |
| Phase 4 | 测试优化提示词效果 | 持续 |

## 修改清单

### Phase 1（立即执行）

| 文件 | 修改内容 |
|------|----------|
| `src/pages/AssessmentCoachPage.tsx` | 三处 "AI情绪健康教练" → "AI情绪教练" |
| `src/components/emotion-health/emotionHealthData.ts` | 三处名称修改 |
| `src/config/growthPathConfig.ts` | 描述修改 |
| `src/components/emotion-health/AssessmentCoachChat.tsx` | 添加初始化标志防止双消息 |

### Phase 2（智能化改造）

| 文件 | 内容 |
|------|------|
| `supabase/functions/assessment-coach-chat/index.ts` | 新建 Edge Function |
| `src/components/emotion-health/AssessmentCoachChat.tsx` | 重构为AI驱动对话 |
| `src/components/emotion-health/emotionHealthData.ts` | 添加阶段提示词配置 |
