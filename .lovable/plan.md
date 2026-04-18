
## 问题诊断

用户截图显示：未登录状态点击「立即测评」直接弹出付费弹窗，跳过了「先登录」步骤。

排查 `WealthBlockAssessment.tsx` 中 `AssessmentIntroCard onStart` 回调的实际实现。
