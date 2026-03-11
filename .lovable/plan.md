

## 将 /mama 改造为有劲AI极简入口模式

### 当前状态
/mama 使用 `PageHeader` + 多个功能模块卡片堆叠 + 底部固定输入栏，风格较重。

### 目标
复制小劲AI / 大劲AI的极简入口模式：顶部导航栏（左：返回链接，右：分享按钮）→ 品牌标题 → 居中大圆按钮（核心CTA）→ 3列功能入口 → 底部横幅CTA → Footer。

### 具体改动

**1. 添加分享配置 `introShareConfigs.mama`**
- 在 `src/config/introShareConfig.ts` 添加 mama 条目
- title: "宝妈AI助手", emoji: "💖", targetUrl: "/mama"

**2. 重写 `src/pages/MamaAssistant.tsx`**
- 移除 `PageHeader`，改用与小劲/大劲一致的自定义顶栏
  - 左上角：Home 图标 + "有劲生活馆"（链接到 `/`）
  - 右上角：分享按钮（IntroShareDialog）
- 品牌区：**宝妈AI** + 口号 "懂 你 的 温 暖 陪 伴"
- 居中大圆按钮（粉/玫瑰色渐变，120-140px）：点击打开 MamaAIChat
  - 图标：MessageCircle，文字："聊一聊"
- 3列功能入口卡片：
  - 😊 情绪检测 → MamaEmotionCheck（或直接打开chat with context）
  - ⚡ 能量评估 → MamaDailyEnergy 的逻辑
  - 📝 感恩日记 → 打开chat with gratitude context
- 横幅CTA：趣味测评入口（MamaAssessmentEntry 的功能）
- 保留 MamaAIChat 弹窗、MamaAssessment 子页面
- 移除 MamaBottomInput 固定底栏、MamaCampEntry
- 保留 MamaQuickScenarios 作为场景快捷按钮（放在功能卡片下方）

**3. 保留的核心交互**
- 所有聊天仍通过 MamaAIChat drawer 打开
- 测评仍通过 showAssessment 状态切换
- lastChat 逻辑可移除（底部输入栏已去掉）

### 视觉风格
- 背景：`from-pink-50 via-rose-50/40 to-white`（粉色系，区别于小劲橙色和大劲暖橙）
- 大按钮：玫瑰粉渐变 `from-pink-400 via-rose-500 to-pink-500`
- 功能卡片：粉色系边框和背景

