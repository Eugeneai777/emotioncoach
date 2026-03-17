
目标：一次性解决两个问题  
1) 从「我的 > 设置」进入「提醒设置 / 通知偏好」时，必须只显示对应模块；  
2) 小火箭功能在全站隐藏。

实施方案（按文件）：

1. `src/pages/Settings.tsx`
- 重构“精简视图”判定，不只依赖单一参数，改为“统一目标模块解析”：
  - 优先 `view`（profile/reminders/notifications）
  - 兜底 `tab`（仅在来自我的页入口时启用）
- 将当前“精简视图仍包在 Tabs 中”的方式改为：  
  **精简视图直接渲染单模块内容，不渲染 Tabs 容器**。  
  这样可彻底避免资料/账户/提醒/通知同时出现。
- 保留普通 `/settings` 完整模式（TabsList + 多模块）不变。
- 精简视图下继续隐藏 Logo，并按模块动态标题：
  - profile → 个人资料
  - reminders → 提醒设置
  - notifications → 通知偏好

2. `src/pages/MyPage.tsx`
- 设置区两个入口改成更稳健的跳转参数（带明确入口标记），例如：
  - 提醒设置：`/settings?view=reminders&entry=my-page`
  - 通知偏好：`/settings?view=notifications&entry=my-page`
- 保证 Settings 页能稳定识别这是“单模块精简打开”，避免环境差异导致回退到完整 Tabs 模式。

3. 全站隐藏小火箭（`src/components/FloatingQuickMenu.tsx` 或 `src/App.tsx`）
- 采用“全局关闭”而非逐路由排除，确保所有页面都不再显示小火箭：
  - 方案A（推荐）：在 `App.tsx` 停止渲染 `<FloatingQuickMenu />`
  - 方案B：在 `FloatingQuickMenu` 内增加全局禁用开关直接 `return null`
- 这样不会再依赖路由匹配，避免遗漏页面。

技术细节（保证稳定性）：
- 关键修复点是把精简模式从“隐藏 TabsList”升级为“只渲染目标模块”，避免不同 WebView 对 Tabs/hidden 的渲染差异。
- 普通设置页能力不受影响；仅“我的页设置入口”触发单模块模式。
- 小火箭使用全局开关关闭，避免继续在 `/assessment-picker` 等页面出现。

验收清单：
1) 从「我的 > 提醒设置」进入：只看到提醒模块，无资料/账户/通知。  
2) 从「我的 > 通知偏好」进入：只看到通知模块，无资料/账户/提醒。  
3) 从常规入口进入 `/settings`：仍可看到完整 tabs（资料/账户/提醒/通知）。  
4) 任意页面（含 `/assessment-picker`）均不再显示小火箭图标。
