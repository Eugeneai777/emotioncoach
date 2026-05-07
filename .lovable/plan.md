## 问题
情绪健康测评 `/emotion-health` 售前页（`EmotionHealthStartScreen`）的【开始测评】CTA 按钮位于页面最底部（模块8），用户需滚动经过 7 个模块才能看到。

## 优化方案

### 1. 顶部增加快捷 CTA
在 Hero 区（品牌+痛点开场，line ~244）下方直接增加一个醒目的「开始测评」卡片按钮，让用户进入页面即可一键开始，无需下滑。

### 2. 精简中间内容，减少滚动距离
将三层洋葱模型（模块6）中的 3 个 Accordion 表格默认保持折叠收起状态，避免展开后占用过多纵向空间。

### 3. 保留底部 CTA
底部的定价模块和 CTA 按钮保持不变，作为看完所有内容后的补充转化入口。

## 技术细节
- 修改文件：`src/components/emotion-health/EmotionHealthStartScreen.tsx` 1 处
- 复用现有的 `handleButtonClick` 回调，无需改动 `EmotionHealthPage.tsx`
- 保持所有 props 接口不变，兼容现有调用方

## 预期效果
用户进入页面后，首屏即可看到「开始测评」按钮；下滑可了解详情；底部仍有 CTA 兜底。