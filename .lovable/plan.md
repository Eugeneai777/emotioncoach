## 在 mini-app 首页新增「探索模块」区块并加入「故事教练」入口

### 目标
在 `/mini-app` 页面中新增一个「探索模块」功能卡片区，包含原有的 4 张卡片（日常工具、专业测评、系统训练营、健康商城）以及新增的「故事教练」卡片。点击故事教练卡片后，直接跳转到 `/story-coach`。

### 当前状况
- `src/pages/MiniAppEntry.tsx` 中已定义 `exploreBlocks` 数组（4 张卡片），但 JSX 中尚未渲染，属于未上线的死代码。
- 页面当前结构为：顶部标题 → 人群入口 → 活动轮播图 → 个性化问候 → 用户见证 → 语音教练场景卡 → 了解更多 → 底部导航。

### 改动范围

#### 1. 新增故事教练卡片数据
在 `exploreBlocks` 数组中追加第 5 个卡片：
- 图标：`BookOpen`（lucide-react）
- 标题：故事教练
- 副标题：说出你的成长
- 描述：用英雄之旅的方法，把你的经历变成动人的成长故事。
- 路由：`/story-coach`
- 配色：橙色系（与故事教练页面品牌色一致），使用语义化 Tailwind token（如 `text-orange-300`、`bg-orange-500/20`、`from-orange-500/15` 等）
- `illustrationKey`：沿用字符串占位 `block_story_coach`，当前无实际插画加载逻辑，不影响显示。

#### 2. 在 JSX 中渲染「探索模块」区块
在「人群入口」网格与「活动轮播图」之间插入一个新的探索模块区块：
- 区块标题：左侧竖条装饰 + "探索更多" 文案
- 布局：2 列网格（`grid-cols-2 gap-3`），与语音教练场景卡的网格密度相近
- 单张卡片结构：
  - 顶部：图标圆形底色 + 标题 + 副标题
  - 中部：描述文案
  - 底部：带箭头的行动按钮（如 "去创作 →"）
- 动画：与页面其他区块保持一致，使用 `motion.div` 的 `fade-in` + `slide-in-from-bottom` 动画，延迟按索引递增
- 交互：`whileTap={{ scale: 0.95 }}`，点击后直接 `navigate(route)`，无需认证拦截（故事教练支持游客浏览）
- 预加载：`onPointerDown` 时调用 `preloadRouteOnIntent(route)`

#### 3. 确保图标导入
在文件顶部的 `lucide-react` import 中追加 `BookOpen`。

### 不涉及的内容
- 不修改任何业务逻辑、模型配置或现有路由。
- 不删除、不改动现有的 `audiences`、`useCases`、`promoSlides`、`testimonials` 等数组。
- 不修改 `CoachVoiceChat`、语音教练、`/story-coach` 页面本身的代码。
- 不新增图片资源（故事教练卡片使用 lucide 图标 + 渐变背景，无需插画）。

### 技术细节
- 文件：`src/pages/MiniAppEntry.tsx`
- 样式：完全使用 Tailwind 语义类名，不硬编码 hex 颜色，兼容暗色模式。
- 响应式：网格在桌面端可扩展为 `sm:grid-cols-4`，与现有场景卡片的响应式策略一致。