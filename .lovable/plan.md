
# 在财富测评结果页底部添加企业微信二维码卡片

## 目标
在结果页底部添加高转化企业微信二维码卡片，让每个用户都想扫码添加顾问。

## 卡片核心价值主张（非报告解读）
- 获取 **7天财富觉醒路径规划**（个性化觉醒方案）
- **随时财富觉醒对话**（1对1顾问随时沟通）

## 设计策略
1. **个性化痛点呼应**：根据用户的反应模式和主导卡点动态生成文案，如"你的逃避型模式，靠自己很难突破"
2. **价值感强烈**：突出"免费"、"专属"、"7天路径规划"
3. **视觉醒目**：紫金渐变背景 + 脉冲光晕动画，与页面风格一致但足够吸引注意力
4. **社会证明**：加入"已有XXX人开启觉醒之旅"增强信任

## 实现步骤

### 1. 保存二维码图片
将用户上传的企业微信二维码保存至 `src/assets/wealth-advisor-qrcode.jpg`

### 2. 新建 `WealthAdvisorQRCard` 组件
路径：`src/components/wealth-block/WealthAdvisorQRCard.tsx`

组件结构：
- 接收 `reactionPattern` 和 `dominantPoor` 参数
- 根据参数动态生成个性化引导文案
- 卡片布局：
  - 顶部标题："你的专属财富觉醒顾问"
  - 个性化痛点文案（如"你的【心穷】卡点 + 【逃避型】模式，需要专业引导"）
  - 两个核心价值点图标卡片：
    - "7天觉醒路径规划" -- 根据你的测评结果定制专属觉醒方案
    - "随时财富觉醒对话" -- 顾问随时在线，陪你突破每一个卡点
  - 二维码居中展示（白色圆角容器确保识别率）
  - 底部 CTA："扫码添加顾问，开启你的觉醒之旅"
- 使用 framer-motion 入场动画
- 外层脉冲光晕边框吸引注意力

### 3. 集成到 `WealthBlockResult.tsx`
在 `AwakeningJourneyPreview` 和 `BloomInviteCodeEntry` 之间插入，传入用户的 `reactionPattern` 和 `dominantPoor`。

## 技术细节
- 图片使用 `import qrCode from '@/assets/wealth-advisor-qrcode.jpg'` 引入
- 个性化文案通过已有的 `reactionPatternConfig` 和 `fourPoorInfo` 映射表生成，无需 API 调用
- 组件使用 framer-motion 与页面其他卡片动画风格统一
