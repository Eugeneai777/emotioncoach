## 问题定位

1. 当前入口只在底部 CTA 里做了登录判断，但页面主流程 `DynamicAssessmentPage` 传给 `DynamicAssessmentIntro` 的 `onStart={() => setPhase("questions")}` 没有二次校验；如果存在其它入口、旧缓存、或小程序环境触发了开始流程，就可能绕过登录进入答题。
2. `DynamicAssessmentPage` 仍保留了 Lite 答案缓存/恢复逻辑；虽然 `LITE_MODE_KEYS` 已清空，但未登录完成答题缓存与恢复逻辑还在，容易继续造成“未登录可答题”的路径残留。
3. 售前页 CTA 目前放在所有内容之后，确实需要滑到底部才能点击，首屏转化路径太长。

## 实施计划

### 1. 在页面主流程增加硬登录闸门
- 新增统一的 `handleStartAssessment`。
- 当 `requireAuth=true` 且 `user` 不存在时：
  - 提示“请先登录后开始测评”。
  - 记录登录后回跳地址。
  - 跳转 `/auth?redirect=当前测评页`。
- 只有登录后才允许 `setPhase("questions")`。
- `DynamicAssessmentIntro` 的 `onStart` 改为使用这个硬闸门，避免任何按钮或入口绕过。

### 2. 收紧男人有劲的 Lite 残留路径
- 对 `male_midlife_vitality` 明确禁用未登录答题缓存与 Lite 恢复。
- `handleQuestionsComplete` 在未登录且需要登录时直接跳登录，不再保存答案、不再生成结果。
- 登录回跳恢复缓存逻辑只允许真正 Lite 测评使用，不覆盖男人有劲。

### 3. 前置售前页 CTA
- 在【男人有劲状态评估】售前页 Hero/核心信息之后，增加一个醒目的首屏 CTA。
- 底部原 CTA 保留，作为用户看完整页后的第二次转化入口。
- 新 CTA 与底部 CTA 复用同一套登录拦截逻辑，确保不会再出现未登录直接答题。

### 4. 优化按钮文案
- 将按钮文案统一改正为“限时免费开始评估”（修正你截图里“现实免费开始评估”的错字/误识别问题）。
- 不恢复底部“登录后可保存测评记录”小字。

## 预计修改文件

- `src/pages/DynamicAssessmentPage.tsx`
- `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx`