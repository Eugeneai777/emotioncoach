
# 底部添加分享信息卡片

在财富测评结果页底部（绽放邀请码入口下方）新增一个简洁的分享信息卡片，纯信息展示，不包含任何测评结果数据。

## 功能说明
- 全新设计的分享卡片，不复用之前的 WealthInviteCardDialog 或任何旧分享组件
- 点击后可复制分享链接或触发微信分享
- 卡片仅展示产品介绍信息（如"财富卡点测评"名称、简短描述、扫码/链接体验），不显示用户的测评分数或结果

## 技术方案

### 1. 新建组件 `src/components/wealth-block/ShareInfoCard.tsx`
- 独立的分享信息卡片组件
- 包含：标题（如"推荐给朋友"）、简短描述、复制链接按钮
- 使用 framer-motion 添加入场动画
- 支持合伙人推广码（从 URL 参数或用户数据获取 ref）
- 使用 navigator.clipboard 复制分享链接，配合 toast 提示
- 样式：渐变背景卡片，Share2 图标，简洁大方

### 2. 修改 `src/components/wealth-block/WealthBlockResult.tsx`
- 在绽放邀请码入口（BloomInviteCodeEntry）之后、支付对话框之前插入 `<ShareInfoCard />`
- 传入当前页面路径 `/wealth-block` 作为分享链接

### 卡片内容示例
```
[Share图标] 推荐给朋友
发现你的财富卡点，开启觉醒之旅
[复制链接]
```
