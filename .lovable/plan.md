

## 将所有财富教练跳转统一到 `/coach/wealth_coach_4_questions`

### 需要修改的位置

**1. `src/components/SmartHomeRedirect.tsx`（首页智能跳转）**
- 第 68、70、72 行：将 `/wealth-coach-intro` 全部改为 `/coach/wealth_coach_4_questions`

**2. `src/pages/Auth.tsx`（登录后跳转）**
- 第 228 行：`/wealth-coach-intro` 改为 `/coach/wealth_coach_4_questions`（活跃合伙人+已购测评）
- 第 240 行：`/wealth-camp-checkin` 改为 `/coach/wealth_coach_4_questions`（有活跃训练营）
- 第 242 行：`/wealth-coach-intro` 改为 `/coach/wealth_coach_4_questions`（普通财富用户）

### 结果

无论用户从首页进入还是登录后跳转，只要 `preferred_coach` 是 `wealth`，都会直接进入对话页 `/coach/wealth_coach_4_questions`。

