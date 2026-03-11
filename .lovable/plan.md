

# 修复亲子教练邀请卡片宽度过窄问题

## 问题分析

TeenInviteShareCard 使用 `width: '100%', maxWidth: '400px', minWidth: '300px'`，而隐藏导出容器是 `fixed -left-[9999px]`，没有父元素宽度约束。浏览器将卡片渲染为 `minWidth: 300px`，导致所有文字竖排换行、二维码被挤到底部截断。

对比 WealthCampShareCard 使用 ShareCardBase，固定 `width: 340px`，不依赖父容器宽度，因此导出效果正常。

## 修改方案

### 1. `src/components/parent-coach/TeenInviteShareCard.tsx`

将根 div 的尺寸从百分比改为固定宽度：
- `width: '100%'` → `width: '380px'`
- 移除 `maxWidth: '400px'` 和 `minWidth: '300px'`

这样无论在预览还是隐藏导出容器中，卡片都以 380px 固定宽度渲染。

### 2. `src/components/parent-coach/TeenInviteShareDialog.tsx`

预览区域的缩放比例 `scale-[0.45]` 对应 300px 宽度设计，改为 380px 后需要微调：
- 预览容器高度从 `320px/340px` 调整为 `360px/380px`
- 缩放比例从 `0.45` 调为 `0.42` 确保预览不溢出

## 涉及文件

- `src/components/parent-coach/TeenInviteShareCard.tsx` — 固定宽度 380px
- `src/components/parent-coach/TeenInviteShareDialog.tsx` — 调整预览缩放

