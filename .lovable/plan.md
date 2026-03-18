

## /mini-app 页面优化方案（已完成）

### 已完成改动

1. **AwakeningBottomNav.tsx** — 移除「快捷服务」按钮、遮罩层、弹出菜单，底栏精简为「我的」+「开始对话」
2. **MiniAppEntry.tsx** — 新增已购用户快捷面板（我的订单/测评/训练营）+ 精选5条见证横向滚动卡片 + 末尾"查看更多"按钮 + 使用场景引导从折叠区移出直接展示
3. **MiniAppEntry.tsx** — 新增活动轮播图（3张），位于已购快捷面板之后、个性化欢迎语之前：
   - 🎯 找到你的卡点 → 弹出 AssessmentPickerSheet（4个测评，专业版在前）
   - 🌸 7天情绪解压 → `/promo/synergy`
   - 💪 知乐双效解压 → `/promo/zhile-havruta`
   - 使用 embla-carousel-react 实现 3 秒自动轮播 + 圆点指示器
