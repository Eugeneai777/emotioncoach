

## 问题分析

`IntroShareCard.tsx` 中三个模板都使用了固定高度（concise: 420px, value: 480px, scenario: 540px）+ `overflow: hidden`。当内容较多时（用户头像 + emoji + 标题 + 3条亮点 + QR码 + 品牌footer），底部内容被截断，如截图所示 QR 码区域不可见。

## 修改方案

**文件**: `src/components/common/IntroShareCard.tsx`

1. **增加各模板高度**：
   - concise: 420px → 480px（多出 60px 给 QR + footer）
   - value: 480px → 540px
   - scenario: 540px → 580px

2. **压缩内部间距**，防止高度增加后视觉过于松散：
   - 缩小 emoji 字号（48px → 40px）
   - 缩小 UserHeader marginBottom（16px → 12px）
   - highlight 卡片 padding 微调（12px → 10px）

3. **QR + BrandFooter 区域加 `flexShrink: 0`**，确保不会被 flex 布局压缩。

改动仅限 `IntroShareCard.tsx` 一个文件，不影响其他分享卡片组件。

