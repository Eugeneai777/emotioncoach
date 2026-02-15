

## 将财富教练对话功能独立到新页面 `/wealth-coach-chat`

### 概述
把 `/coach/wealth_coach_4_questions` 页面改为**仅显示介绍内容**（步骤卡片、训练营等），不再包含对话功能。对话功能移到全新的独立页面 `/wealth-coach-chat`。

### 修改内容

**1. 新建页面 `src/pages/WealthCoachChat.tsx`**
- 创建一个独立的财富教练对话页面
- 复用现有的 `CoachLayout` 组件，但跳过空状态介绍（`skipEmptyState`）
- 使用与 `DynamicCoach.tsx` 中财富教练相同的聊天逻辑（`useDynamicCoachChat`、`useCoachTemplate` 等）
- 页面打开即显示对话输入框，可以直接开始对话

**2. 修改 `src/App.tsx`**
- 添加新路由：`/wealth-coach-chat` 指向 `WealthCoachChat` 组件

**3. 修改 `src/pages/DynamicCoach.tsx`**
- 当 `coachKey === 'wealth_coach_4_questions'` 时，不渲染对话功能
- 只显示 `CoachEmptyState`（介绍视图），并在介绍页中添加一个按钮跳转到 `/wealth-coach-chat`

**4. 更新各处跳转链接**
- `src/pages/WealthBlockAssessment.tsx`：「财富教练」按钮改为跳转到 `/wealth-coach-chat`
- `src/pages/Auth.tsx`：登录后财富用户的跳转目标改为 `/wealth-coach-chat`
- `src/components/coach-call/AICoachCallProvider.tsx`：wealth 映射改为 `/wealth-coach-chat`
- `src/pages/WealthCoachIntro.tsx`：「开始」按钮改为跳转到 `/wealth-coach-chat`
- `src/pages/WealthCampCheckIn.tsx`：相关跳转改为 `/wealth-coach-chat`
- 其他引用 `/coach/wealth_coach_4_questions` 作为对话入口的地方

### 技术细节

新页面 `WealthCoachChat.tsx` 核心结构：
```tsx
const WealthCoachChat = () => {
  const coachKey = "wealth_coach_4_questions";
  const { data: template } = useCoachTemplate(coachKey);
  // 复用 useDynamicCoachChat hook
  // 渲染 CoachLayout，跳过 EmptyState
  return (
    <CoachLayout
      {...templateProps}
      skipEmptyState={true}
      messages={messages}
      // ... 其他 props
    />
  );
};
```

`CoachLayout.tsx` 新增 `skipEmptyState` prop：
```tsx
// 接口新增
skipEmptyState?: boolean;

// 条件渲染修改
(messages.length === 0 && !skipEmptyState) 
  ? <CoachEmptyState ... /> 
  : <ChatMessages />
```

### 最终效果
- `/coach/wealth_coach_4_questions`：仅显示介绍内容（步骤、训练营信息），不含对话
- `/wealth-coach-chat`：纯对话页面，打开即可开始聊天
- 所有需要进入对话的按钮都跳转到 `/wealth-coach-chat`

