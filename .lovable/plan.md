

# 绽放合伙人页面 - 专属新手引导

## 概述
为绽放合伙人介绍页（BloomPartnerIntro）添加专属的新手引导，复用项目已有的 `PageTour` 组件和 `usePageTour` Hook，保持一致的用户体验。

## 引导内容（3步）

| 步骤 | 图标 | 标题 | 说明 |
|------|------|------|------|
| 1 | 🌸 | 欢迎来到绽放合伙人 | 介绍这是什么：三大权益入口，一站式了解和开启你的绽放之旅 |
| 2 | 🎯 | 三大核心权益 | 分别介绍绽放合伙人计划、财富卡点测评、财富觉醒训练营 |
| 3 | 📱 | 如何开始 | 引导用户先登录/注册，然后点击卡片进入对应功能 |

## 技术实现

### 1. 添加配置（`src/config/pageTourConfig.ts`）
在 `pageTourConfig` 中新增 `bloom_partner_intro` 键，包含 3 个 `TourStep` 步骤。

### 2. 修改页面（`src/pages/BloomPartnerIntro.tsx`）
- 导入 `PageTour` 组件和 `usePageTour` Hook 及 `pageTourConfig`
- 调用 `usePageTour('bloom_partner_intro')` 获取 `showTour` 和 `completeTour`
- 在页面底部渲染 `<PageTour>` 组件，与其他页面保持一致的模式

完全复用现有组件，无需创建新文件或新增数据库表。引导完成状态会自动通过 `usePageTour` 保存（已登录存数据库，未登录存 localStorage）。
