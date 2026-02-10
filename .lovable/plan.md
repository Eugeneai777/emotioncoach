

## 全教练体系同步：告别检测 + 未完成对话恢复

### 当前状态

**告别检测规则**已添加的教练（3个）：
- emotion-coach
- assessment-coach-chat
- assessment-emotion-coach

**尚未添加告别规则**的教练（5个）：
- vibrant-life-sage-coach（有劲生活教练）- 有部分结束检测但缺少"不再追问"的强制规则
- carnegie-coach（沟通教练）
- gratitude-coach（感恩教练）
- parent-emotion-coach（亲子教练）
- wealth_coach_4_questions-coach（财富教练）

**未完成对话恢复**：仅 `AssessmentCoachChat` 已实现，其他所有教练使用的 `useDynamicCoachChat` 钩子没有恢复逻辑。

---

### 修改方案

#### 第一部分：为5个教练函数添加告别检测规则

在每个函数构建 `systemPrompt` 的位置，注入统一的告别规则：

```text
【最高优先级规则：结束对话检测】
当用户表达结束对话意图时（包括但不限于："今天先聊到这"、"谢谢陪伴"、"再见"、"我先走了"、"下次再聊"、"好的，拜拜"、"不聊了"、"就到这吧"），你必须：
1. 温暖简短地回应，肯定本次对话的收获
2. 绝对不要再追问任何问题
3. 回复2-3句即可
4. 以温柔祝福结尾，如"照顾好自己哦"
```

| 文件 | 注入位置 |
|------|----------|
| `supabase/functions/vibrant-life-sage-coach/index.ts` | 第369行 `systemPrompt` 拼接处，在 `conversationStyleGuide` 之后 |
| `supabase/functions/carnegie-coach/index.ts` | 第310行 `systemPrompt` 拼接处 |
| `supabase/functions/gratitude-coach/index.ts` | 第192行 `systemPrompt` 拼接处 |
| `supabase/functions/parent-emotion-coach/index.ts` | 第435行 `systemPrompt` 拼接处，以及第575行 `continueSystemPrompt` 处 |
| `supabase/functions/wealth_coach_4_questions-coach/index.ts` | 第769行标准模式 `systemPrompt` 拼接处 |

#### 第二部分：`useDynamicCoachChat` 添加未完成对话恢复

这是关键改动 -- 因为财富教练、亲子教练、感恩教练、有劲生活教练都通过 `DynamicCoach.tsx` 使用 `useDynamicCoachChat` 钩子。

**文件：`src/hooks/useDynamicCoachChat.ts`**

在 hook 初始化时添加恢复逻辑：
1. 查询 `coaching_sessions`（或对应的会话表）中 `status = 'active'` 的未完成会话
2. 如果找到，恢复 `messages` 和 `currentConversationId`
3. 如果没有，走原来的创建新会话流程

由于 `useDynamicCoachChat` 通过 `edgeFunctionName` 参数调用各教练的边缘函数，恢复后继续发消息时会自动使用正确的教练。

#### 第三部分：离开页面时触发未完成对话通知

**文件：`src/hooks/useDynamicCoachChat.ts`**

添加组件卸载时的清理逻辑：
- 当用户离开页面且对话未完成（没有生成简报），触发 `generate-smart-notification` 的 `incomplete_coach_session` 场景
- 传入 `coachKey` 以区分不同教练的通知

**文件：`supabase/functions/generate-smart-notification/index.ts`**

扩展已有的 `incomplete_emotion_session` 场景为通用的 `incomplete_coach_session`：
- 根据 `coachKey` 生成不同教练风格的提醒文案
- `action_data` 包含正确的页面路由和 `sessionId`

#### 第四部分：`DynamicCoach.tsx` 支持从通知跳转恢复

**文件：`src/pages/DynamicCoach.tsx`**

从 `location.state` 读取 `sessionId`，传递给 `useDynamicCoachChat` 以精确恢复指定会话。

---

### 修改文件清单

| 文件 | 改动 |
|------|------|
| `supabase/functions/vibrant-life-sage-coach/index.ts` | 添加告别检测规则 |
| `supabase/functions/carnegie-coach/index.ts` | 添加告别检测规则 |
| `supabase/functions/gratitude-coach/index.ts` | 添加告别检测规则 |
| `supabase/functions/parent-emotion-coach/index.ts` | 添加告别检测规则（两处） |
| `supabase/functions/wealth_coach_4_questions-coach/index.ts` | 添加告别检测规则 |
| `src/hooks/useDynamicCoachChat.ts` | 添加未完成会话恢复 + 离开时触发通知 |
| `src/pages/DynamicCoach.tsx` | 支持从通知跳转传入 sessionId |
| `supabase/functions/generate-smart-notification/index.ts` | 扩展为通用 `incomplete_coach_session` 场景 |

### 预期效果

- 所有 AI 教练在用户说"再见"后都只温暖告别，不再追问
- 用户中途离开任何教练对话后，再次进入时自动恢复
- 离开未完成对话后收到智能提醒，点击可直接恢复
