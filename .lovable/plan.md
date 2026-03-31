

# 教练空间 `/coach-space` 全面优化方案

## 当前问题
- 单列平铺卡片视觉单调，桌面端大量留白
- 缺少个性化元素（最近使用、推荐标识不够突出）
- 欢迎语和分区标题层级弱，缺乏视觉引导
- 真人教练区与AI教练区视觉风格不统一

## 改动计划

### 1. `src/pages/CoachSpace.tsx` — 页面结构重构

- **顶部欢迎区**：增加用户称呼（已登录时显示）、当前时段问候语（早上好/下午好/晚上好），背景加柔和渐变装饰
- **最近使用**：新增"最近使用的教练"横向滚动区（从 `localStorage` 读取最近访问记录），快速回到上次对话
- **AI教练区**：桌面端双列 `grid-cols-2`，移动端单列，分区标题加图标装饰
- **真人教练区**：保持单列，视觉风格与AI卡片统一

### 2. `src/components/coach/EnhancedCoachCard.tsx` — 卡片视觉升级

- 卡片增加微妙的悬浮渐变背景（基于 coach gradient），替代纯白底
- 左侧色条加宽为圆角色块装饰
- emoji 区域增加光晕效果（`ring` + 半透明背景）
- 添加右侧箭头指示器，hover 时平移动画
- 推荐/新 badge 样式升级为 pill 形状 + 渐变色

### 3. `src/components/coach/HumanCoachEntry.tsx` + `TeamCoachingEntry.tsx` — 统一风格

- 与 EnhancedCoachCard 视觉语言对齐：统一圆角、间距、字体大小
- 保持各自渐变色区分

### 4. 新增 `src/hooks/useRecentCoaches.ts` — 最近使用记录

- 基于 `localStorage` 记录用户最近访问的教练（coach_key + 时间戳）
- 提供 `useRecentCoaches()` hook 返回最近 3 个教练
- 在 EnhancedCoachCard 的 `onClick` 中调用记录方法

### 5. `src/components/CoachCardSkeleton.tsx` — 骨架屏适配双列

- 桌面端渲染 2 列骨架卡片

## 不变项
- 不修改路由、业务逻辑、数据库
- 不改教练模板数据结构
- 保持现有功能（通知、跳转）完整

## 技术细节
- 响应式断点：`md:grid-cols-2`（768px+双列）
- 最近使用存储 key：`recent_coaches`，JSON 数组，最多保留 5 条
- 时段问候：6-12 早上好、12-18 下午好、18-24/0-6 晚上好

