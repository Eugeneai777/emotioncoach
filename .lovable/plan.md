

## 修改"AI教练"按钮跳转目标

### 当前行为
点击"AI教练"按钮后跳转到教练空间页面（`/coach-space`）。

### 修改方案

**修改文件：`src/pages/WealthBlockAssessment.tsx`**

将按钮的 `onClick` 跳转路径从 `/coach-space` 改为 `/coach/wealth_coach_4_questions`，让用户直接进入财富教练对话页面。

仅需修改一行代码：
```
onClick={() => navigate("/coach/wealth_coach_4_questions"))
```
