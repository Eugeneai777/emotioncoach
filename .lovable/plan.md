

## 改回跳转到 /wealth-coach-chat

### 变更

**1. `src/components/wealth-block/AssessmentVoiceCoach.tsx`**
- 将 `navigate('/coach/wealth_coach_4_questions', ...)` 改回 `navigate('/wealth-coach-chat', ...)`

**2. `src/pages/DynamicCoach.tsx`**
- 移除上次添加的测评相关代码：`PostCallAdvisorDialog` 导入、`LocationState` 中的 `fromAssessment/autoStartVoice/assessmentData/reactionPattern/dominantPoor` 字段、`showPostCallDialog/hasAutoStarted` 状态、自动启动语音的 `useEffect`、`CoachVoiceChat` 中的测评条件逻辑、`PostCallAdvisorDialog` 渲染，恢复原始简洁实现。

`/wealth-coach-chat` 页面已有完整的 💎 图标、"财富觉醒教练"标题、全屏语音通话、`autoStartVoice` 处理和 `PostCallAdvisorDialog` 支持，无需额外修改。

