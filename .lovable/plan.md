

## 未完成对话恢复 + 智能提醒方案

### 问题分析

目前 `AssessmentCoachChat` 组件中的对话状态（messages、sessionId、currentStage）仅存储在 React 的内存状态中。用户离开页面后，虽然后端 `emotion_coaching_sessions` 表已保存了 messages 和 current_stage，但前端没有恢复逻辑。

好消息是：**后端已经保存了所有必要数据**（messages、current_stage、status、metadata），只需要在前端添加恢复逻辑 + 后端添加通知场景。

### 修改方案

#### 第一部分：前端 - 恢复未完成对话

**文件：`src/components/emotion-health/AssessmentCoachChat.tsx`**

修改初始化逻辑（`useEffect` 中的 `init` 函数）：

1. 在创建新会话前，先查询是否存在 `status = 'active'` 且 `source = 'assessment'` 的未完成会话
2. 如果找到，恢复 `sessionId`、`messages`、`currentStage`
3. 如果没有，走原来的创建新会话流程

```text
init() {
  1. 查询 emotion_coaching_sessions WHERE user_id = current_user AND status = 'active' AND source = 'assessment'
  2. 如果存在 → 恢复 sessionId, messages, currentStage
  3. 如果不存在 → 调用 createSession() 创建新会话
}
```

**文件：`src/pages/AssessmentCoachPage.tsx`**

修改页面组件，支持从智能通知点击跳转时携带 `sessionId`：
- 从 `location.state` 中读取 `sessionId`（如果通知带了的话）
- 传递给 `AssessmentCoachChat` 组件

#### 第二部分：后端 - 添加恢复会话的 API

**文件：`supabase/functions/assessment-emotion-coach/index.ts`**

添加一个新的 action `resume_session`：
- 接收 `sessionId`，返回该会话的 messages 和 current_stage
- 验证会话属于当前用户且状态为 active

#### 第三部分：离开页面时触发未完成对话通知

**文件：`src/components/emotion-health/AssessmentCoachChat.tsx`**

在组件中添加 `beforeunload` 和路由离开时的逻辑：
- 当用户离开页面时，如果对话尚未完成（没有生成简报），调用 `generate-smart-notification` 触发一条"未完成对话"提醒

**文件：`supabase/functions/generate-smart-notification/index.ts`**

添加新的通知场景 `incomplete_emotion_session`：
- 标题示例：「你的情绪觉察之旅还没结束哦 🌿」
- 消息内容：AI 根据用户已聊到的阶段，生成个性化的回访提醒
- action_type: `navigate`
- action_data: `{ path: '/assessment-coach', sessionId: '...' }`
- coach_type: `emotion`

#### 第四部分：通知点击跳转恢复

**文件：处理通知点击的组件**（需确认具体在哪个组件处理 action_type = 'navigate'）

确保当用户点击 `incomplete_emotion_session` 类型的通知时，携带 `sessionId` 跳转到 `/assessment-coach` 页面。

### 技术细节

**数据库**：无需新增表或字段，`emotion_coaching_sessions` 已有所有必要字段：
- `messages` (jsonb) - 完整对话历史
- `current_stage` (integer) - 当前阶段 0-5
- `status` (text) - active/completed
- `metadata` (jsonb) - 包含 pattern 和 patternName（注：该列在 schema 中未显示，但代码中有使用）

**前端恢复流程**：

```text
用户打开 /assessment-coach
  ├── 查询 active 会话
  │   ├── 找到 → 恢复对话（显示历史消息 + 当前阶段）
  │   └── 未找到 → 创建新会话（原流程）
  └── 用户离开（未完成）
      └── 触发 incomplete_emotion_session 通知
```

**通知场景提示词**：

```text
incomplete_emotion_session:
  "用户有一个未完成的情绪觉察对话，已进行到第{current_stage}阶段。
   请温暖地提醒他们回来继续，强调已有的进展不会丢失。
   语气轻松，不施压。"
```

### 修改文件清单

| 文件 | 改动 |
|------|------|
| `src/components/emotion-health/AssessmentCoachChat.tsx` | 添加恢复未完成会话逻辑 + 离开时触发通知 |
| `src/pages/AssessmentCoachPage.tsx` | 支持从通知跳转时传入 sessionId |
| `supabase/functions/assessment-emotion-coach/index.ts` | 添加 `resume_session` action |
| `supabase/functions/generate-smart-notification/index.ts` | 添加 `incomplete_emotion_session` 场景 |

### 预期效果

- 用户中途离开后，再次进入页面时自动恢复到上次对话位置
- 离开未完成对话后，智能消息中会收到温暖的提醒
- 点击通知可直接跳转回未完成的对话
- 已完成的对话不会被恢复（只恢复 status = 'active' 的会话）
