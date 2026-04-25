## 修复与优化方案

### 目标
修复 `https://wechat.eugenewe.net/emotion-coach` 页面完成情绪四部曲、生成简报后，自动推荐课程点击「立即观看/点击观看」无反应的问题；保留现有简报生成、课程推荐、额度扣除、观看记录、收藏逻辑，不影响其他 AI 教练功能。

### 根因判断
`/emotion-coach` 的链路是：

```text
Index.tsx (/emotion-coach)
  -> useStreamChat 生成简报并调用 recommend-courses
  -> CoachLayout
  -> ChatMessage
  -> VideoRecommendations
  -> 点击课程按钮
```

当前 `VideoRecommendations.tsx` 中点击按钮后，会先异步执行登录检查、课程额度扣除、观看记录写入，然后才执行：

```ts
window.open(rec.video_url, '_blank')
```

在微信浏览器/小程序 WebView/部分鸿蒙或安卓浏览器中，`window.open` 如果不是在用户点击的同步调用栈里直接触发，常会被拦截或静默失败，所以用户看到的现象就是「点了没反应」。此外按钮没有 loading 状态和弹窗拦截兜底，也放大了这个问题。

### 实施方案

1. **只优化课程观看入口，不改情绪教练主流程**
   - 修改重点放在 `VideoRecommendations.tsx`。
   - 不改 `useStreamChat` 的简报生成逻辑。
   - 不改 `recommend-courses` 推荐逻辑。
   - 不改情绪四部曲阶段推进逻辑。

2. **增加可靠的课程打开策略**
   - 点击按钮时先做链接有效性校验。
   - 微信/移动端环境下，优先使用当前 WebView 跳转 `window.location.assign(videoUrl)`，避免 `_blank` 被拦截导致无反应。
   - 普通浏览器中继续尝试新标签页打开。
   - 如果新标签页被拦截，提供 toast 明确提示，并给出「点击打开」兜底操作。

3. **保留原有额度与观看记录规则**
   - 继续调用 `deductVideoQuota(user.id, rec.id, rec.title, 'video_recommendations')`。
   - 继续只在首次观看时写入 `video_watch_history`。
   - 额度不足、未登录、操作失败仍阻止打开课程。
   - 不绕过任何现有付费/会员权益校验。

4. **补充点击反馈，避免用户误以为无响应**
   - 增加 `openingCourseId` 状态。
   - 当前课程按钮点击后显示「正在打开...」并禁用重复点击。
   - 失败时恢复按钮并显示明确原因。
   - 收藏按钮在课程打开处理中不被误触发。

5. **架构优化：抽出可复用外链打开工具**
   - 新增轻量工具函数，例如 `src/utils/openExternalUrl.ts`。
   - 统一处理：微信环境判断、移动端同窗跳转、普通浏览器新窗口、弹窗拦截兜底。
   - 先在 `VideoRecommendations` 使用，后续其他课程入口可逐步复用，但本次不批量改动其他教练入口，避免扩大影响范围。

### 验证方案

1. TypeScript 检查通过。
2. `/emotion-coach` 完成四部曲后推荐课程正常展示。
3. 点击「立即观看/点击观看」后按钮立即出现 loading 反馈。
4. 已登录且额度正常时，课程能在微信/移动端正常跳转打开。
5. 未登录、额度不足、课程链接为空时有明确提示，不出现静默无反应。
6. 收藏、简报保存、推荐生成、训练营自动打卡等原有逻辑不变。