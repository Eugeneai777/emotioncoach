

## 修改财富教练首页跳转目标

### 修改方案

**修改文件：`src/components/SmartHomeRedirect.tsx`**

将财富教练用户的所有跳转路径统一改为 `/wealth-coach-intro`（财富教练介绍页），不再根据合伙人状态或训练营状态跳转到对话页。

具体改动：
- 第 63 行和第 70 行的 `/coach/wealth_coach_4_questions` 都改为 `/wealth-coach-intro`
- 这样无论用户是活跃合伙人、有训练营还是普通用户，只要 `preferred_coach` 是 `wealth`，都会进入介绍页

