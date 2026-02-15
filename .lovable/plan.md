
## 将所有财富教练相关路径统一指向 `/coach/wealth_coach_4_questions`

### 需要修改的文件和位置

**1. `src/components/SmartHomeRedirect.tsx`（首页智能跳转）**
- 第 68 行：`/wealth-coach-chat` → `/coach/wealth_coach_4_questions`
- 第 70 行：`/wealth-camp-checkin` → `/coach/wealth_coach_4_questions`
- 第 72 行：`/wealth-coach-intro` → `/coach/wealth_coach_4_questions`
- 效果：所有 wealth 用户（无论合伙人、训练营还是新用户）首页都跳转到同一个页面

**2. `src/pages/Auth.tsx`（登录后跳转）**
- 第 228 行：`/wealth-coach-chat` → `/coach/wealth_coach_4_questions`
- 第 240 行：`/wealth-coach-chat` → `/coach/wealth_coach_4_questions`
- 第 242 行：`/wealth-coach-chat` → `/coach/wealth_coach_4_questions`
- 效果：财富用户登录后统一跳转到 `/coach/wealth_coach_4_questions`

**3. `src/pages/WealthCoachIntro.tsx`（介绍页"开始"按钮）**
- 第 31 行：`/wealth-coach-chat` → `/coach/wealth_coach_4_questions`
- 第 33 行：returnTo 从 `/wealth-coach-chat` → `/coach/wealth_coach_4_questions`

**4. `src/pages/WealthBlockAssessment.tsx`（测评页返回按钮）**
- 第 681 行：backTo 从 `/wealth-coach-chat` → `/coach/wealth_coach_4_questions`
- 第 688 行：navigate 目标从 `/wealth-coach-chat` → `/coach/wealth_coach_4_questions`

**5. `src/pages/WealthCampCheckIn.tsx`（训练营页面跳转按钮）**
- 第 854 行：`/wealth-coach-chat` → `/coach/wealth_coach_4_questions`

**6. `src/components/coach-call/AICoachCallProvider.tsx`（语音通话结束后跳转）**
- 第 42 行：wealth 映射从 `/wealth-coach-chat` → `/coach/wealth_coach_4_questions`

**7. `src/hooks/useQuickMenuConfig.ts`（快捷菜单）**
- 第 27 行已经是 `/coach/wealth_coach_4_questions`，无需修改
- 第 76-77 行：旧路径重定向目标从 `/coach/wealth_coach_4_questions` 确认保持不变

### 不修改的部分
- `/wealth-coach-chat` 路由本身保留在 `App.tsx` 中，页面仍可直接访问
- `/wealth-camp-checkin`、`/wealth-coach-intro` 等独立页面保持不动，只是不再作为自动跳转目标
- `ogConfig.ts` 中的 SEO 配置保持不变
