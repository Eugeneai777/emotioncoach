

## 计划：语音入口改为圆形对话按钮

### 改动

**修改 `src/pages/xiaojin/XiaojinHome.tsx`**

在三个功能卡片和"成长100天挑战"之间，添加一个居中的圆形语音按钮（参考 `TeenVoiceCallCTA` 的圆形按钮风格）：

- 橙色渐变圆形按钮（约 120x120px），带电话图标
- 外圈呼吸脉冲动画（橙色光晕）
- 按钮下方文字："AI小劲 · 随时聊"
- 点击导航到 `/xiaojin/voice`
- 使用 framer-motion 动画，与页面风格一致

视觉效果类似 `TeenVoiceCallCTA` 的圆形按钮，但配色改为橙色/琥珀色主题。

