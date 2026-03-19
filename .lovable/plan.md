

## Plan: 所有页面问候语统一增加时区感知

### 影响范围排查结果

以下 5 个组件均使用 `usePersonalizedGreeting` hook，调用同一个 `generate-greeting` 后端函数：

1. **MiniAppEntry.tsx** — mini-app 首页（你当前看到的）
2. **SuperEntry.tsx** — 生活实验室首页
3. **VoiceCallCTA.tsx** — 语音通话入口
4. **EmotionVoiceCallCTA.tsx** — 情绪教练语音入口
5. **ParentVoiceCallCTA.tsx** — 亲子教练语音入口

**结论：修复 1 个 hook + 1 个后端函数 = 全平台生效，无需逐页修改。**

### 修改内容

**文件 1：`src/hooks/usePersonalizedGreeting.ts`**
- 调用 `generate-greeting` 时在 body 中传入用户浏览器本地时间：
  - `localHour`: `new Date().getHours()`（0-23）
  - `timezone`: `Intl.DateTimeFormat().resolvedOptions().timeZone`
- 兼容性：这两个 API 所有现代浏览器（含微信内置浏览器）均支持

**文件 2：`supabase/functions/generate-greeting/index.ts`**
- 从请求 body 解析 `localHour` 和 `timezone`
- 若未传入，fallback 到 UTC+8 计算
- 根据 `localHour` 生成时段标签并加入上下文：
  - 0-5 → 深夜
  - 6-11 → 早上
  - 12-17 → 下午
  - 18-23 → 晚上
- 系统提示词增加第 8 条规则：**必须匹配用户当前时段，禁止在非早上时段使用"早起""早安"等词汇，深夜要关心休息**

### 不涉及的内容
- 不改动任何组件文件（5 个组件零改动）
- 不改动数据库
- 不改动路由

