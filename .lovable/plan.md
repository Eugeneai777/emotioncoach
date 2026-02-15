

## 让 `/coach/wealth_coach_4_questions` 只显示介绍内容

### 修改方案

**文件 1：`src/pages/DynamicCoach.tsx`**

在渲染 `CoachLayout` 时，当 `coachKey === 'wealth_coach_4_questions'` 时：
- `messages` 传空数组 `[]`
- `isLoading` 传 `false`
- `input` 传空字符串
- `onInputChange` 传空函数
- `onSend` 传空函数
- 新增 `hideInput: true` 隐藏输入框
- 在 `CoachEmptyState` 中添加"开始对话"按钮（通过 `chatEntryRoute` prop）

Hook 仍然被调用（React 规则不允许条件调用），但返回值不使用。

**文件 2：`src/components/coach/CoachLayout.tsx`**

- 新增可选 prop `hideInput?: boolean` 和 `chatEntryRoute?: string`
- 当 `hideInput` 为 true 时，不渲染底部 `CoachInputFooter`
- 将 `chatEntryRoute` 传递给 `CoachEmptyState`

**文件 3：`src/components/coach/CoachEmptyState.tsx`**

- 新增可选 prop `chatEntryRoute?: string`
- 当提供该 prop 时，在介绍内容底部显示一个"开始对话"按钮，点击跳转到 `/wealth-coach-chat`

### 最终效果
- `/coach/wealth_coach_4_questions`：只显示介绍内容 + "开始对话"按钮，无输入框，不恢复对话
- `/wealth-coach-chat`：完整对话页面，包含会话恢复功能

