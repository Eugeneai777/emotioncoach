

## 给大劲AI添加100个免费体验点数（复制小劲AI模式）

### 方案

复制 `useXiaojinQuota` 的 localStorage 免费点数模式，创建 `useDajinQuota` hook，然后在大劲AI的各子页面（聊天、问候、心情、提醒）接入点数扣费逻辑。

### 具体改动

**1. 新建 `src/hooks/useDajinQuota.ts`**
- 复制 `useXiaojinQuota` 结构，key 改为 `dajin_quota`，初始 100 点

**2. 修改 `src/pages/ElderChatPage.tsx`**
- 引入 `useDajinQuota`，每次发送消息扣 1 点
- 点数不足时弹出 `PurchaseOnboardingDialog`

**3. 修改 `src/pages/ElderCarePage.tsx`**
- 引入 `useDajinQuota`，在首页显示剩余点数
- 点数为 0 时各入口显示提示

**4. 修改 `src/pages/ElderMoodPage.tsx`**
- 心情记录扣 1 点

**5. 修改 `src/pages/ElderGreetingPage.tsx`**
- 问候功能扣 1 点

**6. 修改 `src/pages/ElderRemindersPage.tsx`**
- 提醒功能如涉及 AI 交互则扣点

### 扣费标准（与小劲一致）
- 文字交互：1 点/次
- 语音通话（如有）：8 点/分钟

