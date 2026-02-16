
# 教练通话结束后弹窗展示企业微信二维码

## 方案

在 `AssessmentVoiceCoach` 组件中，当用户结束语音教练通话后，自动弹出一个 Dialog，展示企业微信二维码，引导用户扫码添加顾问。

## 实现步骤

### 1. 新建 `PostCallAdvisorDialog` 组件
路径：`src/components/wealth-block/PostCallAdvisorDialog.tsx`

- 一个 Dialog 弹窗，复用 `WealthAdvisorQRCard` 中的二维码和价值主张设计
- 接收 `open`、`onOpenChange`、`reactionPattern`、`dominantPoor` 参数
- 弹窗内容：
  - 顶部："教练对话完成！" + 个性化痛点提示
  - 中间：二维码（直接引用 `wealth-advisor-qrcode.jpg`）
  - 两个价值点：7天觉醒路径规划 + 随时觉醒对话
  - 底部："扫码添加顾问" CTA
- 风格与结果页卡片一致（紫金渐变），但适配弹窗布局

### 2. 修改 `AssessmentVoiceCoach` 组件
- 新增 `showPostCallDialog` 状态
- 将 `CoachVoiceChat` 的 `onClose` 回调改为：先关闭语音通话，再弹出二维码 Dialog
- 渲染 `PostCallAdvisorDialog`，传入用户测评结果中的 `reactionPattern` 和 `dominantPoor`

## 技术细节

- 通话关闭时 `setShowVoiceChat(false)` + `setShowPostCallDialog(true)`，确保两个弹窗不同时出现
- 二维码图片复用已有的 `src/assets/wealth-advisor-qrcode.jpg`
- Dialog 使用 Radix Dialog 保持与项目其他弹窗一致
