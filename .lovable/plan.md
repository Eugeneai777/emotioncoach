
## 目标
把“无法上下滚动”的问题一次性系统性解决：覆盖
- 全部教练空间里的“日记/记录”页面（情绪、沟通、亲子、生活、财富训练营等）
- 管理后台全部页面（/admin/*）

并建立一套可复用的“统一滚动容器标准”，避免未来再出现同类问题。

---

## 你现在遇到的问题为什么会发生（结论）
项目里存在两类页面滚动方式混用：

1) **依赖 body 滚动**（常见写法：根容器用 `min-h-screen`，但不设置 `overflow-y-auto`）
- 这类页面在“body 被锁滚动”的情况下会直接无法滚动（所有浏览器都可能出现）
- 你的报障页面属于这一类：  
  - `/vibrant-life-history`（VibrantLifeHistory.tsx 根容器 `min-h-screen`）  
  - `/history`（History.tsx 根容器 `min-h-screen`）  
  - `/communication-history`（CommunicationHistory.tsx 根容器 `min-h-screen`）  
  - `/parent-child-diary`（ParentChildDiary.tsx 根容器 `min-h-screen`，且详情态也 `min-h-screen`）  
  - `/wealth-camp-checkin`（WealthCampCheckIn.tsx 根容器 `min-h-screen`）  
  - `/wealth-awakening-archive`（WealthAwakeningArchive.tsx 根容器 `min-h-screen`）  
  - `/wealth-journal/:entryId`（WealthJournalDetail.tsx 根容器 `min-h-screen`）
  - 管理后台 `AdminLayout` 根容器 `min-h-screen`（且 main 没有独立滚动容器）

2) **独立容器滚动（推荐标准）**
- 根容器用 `h-screen overflow-y-auto overscroll-contain` + `WebkitOverflowScrolling: 'touch'`
- 这类页面不依赖 body 是否能滚动，稳定。

---

## 范围确认（基于数据库配置的“教练日记路由”）
从数据库中查到各教练的日记入口：
- emotion → `/history`
- communication → `/communication-history`
- gratitude_coach → `/gratitude-history`（这个页面已使用独立滚动容器，通常没问题）
- parent → `/parent-child-diary`
- vibrant_life_sage → `/vibrant-life-history`
- wealth_coach_4_questions → `/wealth-journal`（其中列表页重定向到 `/wealth-camp-checkin?tab=archive`，实际滚动问题在 checkin/详情页）

---

## 实施策略（不会盲目“改所有页面”，而是精准改“需要滚动的页面根容器”）
### A. 建立统一滚动标准（不新增复杂抽象，先用一致的写法）
对所有“内容长度可能超过一屏”的页面根容器统一改为：

```tsx
<div
  className="h-screen overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
  style={{ WebkitOverflowScrolling: "touch" }}
>
  ...
</div>
```

要点：
- `h-screen`：强制页面占满视口高度
- `overflow-y-auto`：由该容器负责滚动（不依赖 body）
- `overscroll-contain`：减少 iOS/安卓回弹导致的滚动穿透/抖动
- `pb-[env(safe-area-inset-bottom)]`：避免底部被安全区遮挡
- `WebkitOverflowScrolling: 'touch'`：iOS 平滑滚动

### B. 管理后台采用“外层锁定 + 内层滚动”的布局（最稳定）
Admin 典型布局应是：
- 外层：`h-screen overflow-hidden flex`
- 右侧内容区：`flex flex-col min-h-0`
- `main`：`flex-1 overflow-y-auto` 作为真正滚动容器

这样既不会让整个页面（包含侧边栏）一起滚，也不会出现内容超出无法滚动。

---

## 将要修改的文件清单（明确、可核对）
### 1) 管理后台滚动修复
- `src/components/admin/AdminLayout.tsx`
  - 把根容器从 `min-h-screen` 改为 `h-screen overflow-hidden`
  - 让 `SidebarInset`/`main` 具备正确的 `min-h-0` 与 `overflow-y-auto`
  - 目标：/admin 任意列表很长时可上下滚动

- `src/pages/Admin.tsx`
  - loading 态目前用 `min-h-screen`，建议改为 `h-screen`（一致性，避免某些浏览器高度计算怪异）

### 2) 教练空间“日记/记录页”滚动修复（依赖 body 的页面全部改为独立滚动容器）
- `src/pages/History.tsx`（情绪日记）
  - 列表态、详情态、loading 态容器统一为独立滚动容器
  - 注意：内部有 sticky header，需要在同一个滚动容器内才能表现正确

- `src/pages/CommunicationHistory.tsx`（沟通日记）
  - 列表态、详情态、loading 态统一独立滚动容器
  - 目前详情态是 `container mx-auto p-6` 直接渲染，需包一层 `h-screen overflow-y-auto...` 否则 body 锁就会挂

- `src/pages/ParentChildDiary.tsx`（亲子日记）
  - 列表态、详情态、loading 态统一独立滚动容器

- `src/pages/VibrantLifeHistory.tsx`（生活记录）
  - 根容器 `min-h-screen` 改为独立滚动容器
  - 注意：末尾 JSX 目前有一个 `</div>` 包裹范围要对齐（保持结构不变，仅替换 className/加 style）

- `src/pages/WealthCampCheckIn.tsx`（财富训练营打卡/归档）
  - 根容器 `min-h-screen` 改为独立滚动容器
  - loading/empty 态也改为 `h-screen flex items-center justify-center`，避免某些机型出现“看似一屏但不可滚”的情况

- `src/pages/WealthAwakeningArchive.tsx`（财富觉醒归档）
  - 根容器 `min-h-screen` 改为独立滚动容器
  - empty/loading 态同样统一

- `src/pages/WealthJournalDetail.tsx`（财富日记详情）
  - 根容器 `min-h-screen` 改为独立滚动容器
  - sticky header 保持不变，但外层必须是 scroll container

（可选）如果你希望“一次性覆盖更多类似页面”，我会在实现阶段按规则再扫一遍：凡是“内容很长 + 依赖 min-h-screen + 无 overflow-y-auto”的页面，统一替换为标准容器；但会避免改那些本来不需要滚动的纯 loading/landing 页，以降低回归风险。

---

## 验证方式（我会按这个清单逐个确认）
### 1) 用户端教练日记页
逐个打开并验证可上下滚动：
- `/history`
- `/communication-history`
- `/parent-child-diary`
- `/vibrant-life-history`
- `/wealth-camp-checkin?tab=archive`
- `/wealth-awakening-archive`
- `/wealth-journal/:entryId`（从归档/列表点进去）

验证点：
- 手指/鼠标滚轮可滚动
- sticky header 不抖、不穿透
- 底部按钮/输入区不遮挡内容（尤其财富训练营 checkin 页面）

### 2) 管理后台
- `/admin/users`、`/admin/orders`、`/admin/camps`（任意长列表）
验证点：
- 右侧内容可滚动
- 侧边栏保持可用
- 弹窗（Radix Dialog/Sheet）打开关闭后不影响滚动（已有 ScrollUnlocker，配合独立滚动容器更稳）

---

## 风险与边界情况（提前规避）
1) **双重滚动**：如果某些页面内部已经有 `ScrollArea`，外层再变成滚动容器可能出现“里外都能滚”。  
处理策略：外层只负责页面级滚动；组件级 `ScrollArea` 仅用于弹窗/局部区域（如 Sheet 里的内容），一般不会冲突。遇到冲突再针对性把内部高度固定或移除局部滚动。

2) **iOS 100vh 问题**：已用 `h-dvh`/`WebkitOverflowScrolling` 的页面更稳；本次标准里至少保证 `h-screen` + touch scrolling。

3) **管理后台 SidebarProvider 自带高度**：SidebarProvider 内部使用 `min-h-svh`，所以 AdminLayout 外层再用 `min-h-screen` 反而会把“滚动责任”交给 body。改成 `h-screen overflow-hidden` 能更符合它的预期。

---

## 实施顺序（确保每一步都可回归）
1) 先修复 AdminLayout（后台立刻恢复可滚动）
2) 再按“教练日记路由清单”逐个修复：History → CommunicationHistory → ParentChildDiary → VibrantLifeHistory → WealthCampCheckIn → WealthAwakeningArchive → WealthJournalDetail
3) 最后做一次全局 grep：找出“min-h-screen 且页面内容明显会很长”的剩余页面，按同规则补齐（可选但推荐）

---

## 你需要提供的信息（如果你愿意更精确）
不需要你技术排查，只要你确认两点即可（不影响我开工修复）：
- 你说“管理后台也无法滚动”，是指桌面端 /admin 在鼠标滚轮下完全不动吗？
- 财富相关你最常用的入口是 `/wealth-camp-checkin` 还是某个具体 `/wealth-journal/:id`？

我将按上述方案在默认模式中逐文件修复并自检。