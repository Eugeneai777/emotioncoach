

## 跳过"准备好了吗？"页面 - 直接显示第一道问答题

### 问题分析

根据用户截图：
- **截图1**：当前显示的"准备好了吗？"页面（`AssessmentStartScreen` 组件）
- **截图2**：用户期望直接看到的第一道问答题页面

当前流程中，`WealthBlockQuestions` 组件内部有一个 `showStartScreen` 状态，默认为 `true`，导致每次进入都先显示"准备好了吗？"介绍页面。

### 解决方案

修改 `WealthBlockQuestions` 组件，添加一个可选的 `skipStartScreen` prop，允许调用方控制是否跳过开始页面。

在 `WealthAssessmentLite` 页面传入 `skipStartScreen={true}` 即可直接进入答题。

---

### 修改方案

#### 文件 1: `src/components/wealth-block/WealthBlockQuestions.tsx`

| 修改项 | 内容 |
|--------|------|
| 新增 prop | `skipStartScreen?: boolean` |
| 修改初始状态 | `useState(!skipStartScreen)` |

```tsx
// 修改接口定义
interface WealthBlockQuestionsProps {
  onComplete: (result: AssessmentResult, answers: Record<number, number>, followUpInsights?: FollowUpAnswer[], deepFollowUpAnswers?: DeepFollowUpAnswer[]) => void;
  onExit?: () => void;
  skipStartScreen?: boolean;  // 新增：是否跳过开始介绍页
}

// 修改组件
export function WealthBlockQuestions({ onComplete, onExit, skipStartScreen = false }: WealthBlockQuestionsProps) {
  // 根据 prop 决定初始状态
  const [showStartScreen, setShowStartScreen] = useState(!skipStartScreen);
  // ...
}
```

#### 文件 2: `src/pages/WealthAssessmentLite.tsx`

| 修改项 | 内容 |
|--------|------|
| 传递 prop | 添加 `skipStartScreen={true}` |

```tsx
<WealthBlockQuestions 
  onComplete={handleComplete} 
  onExit={handleExit}
  skipStartScreen={true}  // 跳过开始页面
/>
```

---

### 流程对比

```text
修改前:
页面加载 → "准备好了吗？"页面 → 点击"开始探索" → 第一道问答题

修改后:
页面加载 → 直接显示第一道问答题
```

---

### 修改文件总览

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/wealth-block/WealthBlockQuestions.tsx` | 修改 | 新增 `skipStartScreen` prop |
| `src/pages/WealthAssessmentLite.tsx` | 修改 | 传入 `skipStartScreen={true}` |

---

### 好处

1. **向后兼容**：其他使用 `WealthBlockQuestions` 的页面不受影响（默认仍显示开始页面）
2. **灵活配置**：轻量版专用，可按需跳过介绍页
3. **最小改动**：仅添加一个 prop，不影响现有逻辑

