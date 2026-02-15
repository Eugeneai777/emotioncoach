

## 测评完成后动画提醒

### 目标

当用户已完成财富卡点测评（Step 1）但尚未开始训练营（Step 2）时，在三部曲卡片中显示一个动画提醒，引导用户继续下一步。

### 实现方案

**修改文件：`src/components/wealth-camp/WealthTrilogyCard.tsx`**

在折叠状态的 Header 区域，当检测到以下条件时显示动画提示：
- 测评已完成 (`assessment.completed === true`)
- 训练营未开始 (`camp.status === 'not_started'`)

动画提示内容：
- 在标题旁显示一个带脉冲动画的小徽章："测评已完成，开启下一步 ✨"
- 使用 `framer-motion` 的 `animate` 实现呼吸灯效果
- 点击可展开折叠并高亮 Step 2

如果三部曲处于折叠状态，徽章更明显（吸引用户展开）；展开后，Step 2 卡片会有一个短暂的边框高亮动画。

### 技术细节

1. 在 Header 右侧（"了解更多"左边）添加动画徽章组件
2. 徽章使用 `motion.span` + `animate={{ scale: [1, 1.05, 1] }}` 脉冲效果
3. 展开时 Step 2 卡片增加 `ring-2 ring-amber-400` 高亮，2 秒后淡出
4. 条件：仅在 `progress.assessment.completed && progress.camp.status === 'not_started'` 时显示

