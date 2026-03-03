

# 优化中场觉醒力测评结果页 — 底部添加重新测评和历史记录

## 当前状态

结果页底部已有"重新测评"和"分享结果"两个按钮，但缺少"历史记录"入口。用户完成测评后无法直接跳转到历史记录页面。

## 修改内容

### 1. 修改 `MidlifeAwakeningResult.tsx` 底部按钮区

将底部操作区从两个按钮改为三个按钮布局：

- **重新测评** — 保留现有 `onRetake` 逻辑
- **历史记录** — 新增，通过新的 `onViewHistory` 回调跳转
- **分享结果** — 保留现有 `onShare` 逻辑

布局调整为：上排两个按钮（重新测评 + 历史记录），下排一个全宽分享按钮，视觉层次更清晰。

接口新增 `onViewHistory?: () => void` prop。

### 2. 修改 `MidlifeAwakeningPage.tsx` 传递回调

在结果页渲染处传入 `onViewHistory` 回调，实现逻辑：
- 切换回 `start` 步骤
- 将 `activeTab` 设为 `history`

这样用户点击后直接回到开始页的历史记录 Tab。

## 技术细节

**MidlifeAwakeningResult.tsx**:
- 新增 `History` 图标 import
- 接口增加 `onViewHistory?: () => void`
- 底部按钮改为两行布局

**MidlifeAwakeningPage.tsx**:
- 给 `MidlifeAwakeningResult` 传入 `onViewHistory={() => { setStep('start'); setActiveTab('history'); }}`

