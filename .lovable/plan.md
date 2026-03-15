

# 新建职场解压轻入口页面（对齐 /mama 风格）

## 问题分析

`/promo/synergy` 是一个 ~1000 行的重型销售页（Hero → 痛点 → 亮点 → 流程 → 成果 → 师资 → 胶囊 → 用户评价 → 购买），不适合作为轻入口。

## 方案

**新建 `/workplace` 轻入口页面**，保留 `/promo/synergy` 作为详细销售页。同时更新 MiniAppEntry 和 AwakeningSystemIntro 中 "职场解压" 的路由指向 `/workplace`。

### 新建文件：`src/pages/WorkplacePage.tsx`

对齐 MamaAssistant 结构：

1. **顶部栏**：左侧 Home 返回 + 右侧分享
2. **品牌标题**：「职场解压」+ 副标题「累了就歇一歇」
3. **中心大按钮**：蓝色渐变圆形，点击进入 AI 对话（职场压力主题），文字"聊一聊"
4. **3列快捷入口**：
   - 😮‍💨 压力释放（AI对话 → 职场压力场景）
   - 🆘 情绪SOS（→ `/emotion-button`）
   - 📝 情绪日记（AI对话 → 情绪记录）
5. **场景卡片**：职场倦怠、开会焦虑、加班疲惫等快速对话入口
6. **功能入口**：
   - 🔋 能量测评（→ `/assessment-tools`）
   - 🔥 协同抗压套餐（→ `/promo/synergy`，链接到完整销售页）
7. **设为我的首页**按钮：`localStorage.setItem('preferred_audience', 'workplace')`
8. **底部**：`<AwakeningBottomNav />`
9. **AI对话 Drawer**：复用类似 MamaAIChat 的对话组件

### 修改文件

| 文件 | 改动 |
|------|------|
| `src/pages/WorkplacePage.tsx` | **新建**，轻入口页面 |
| `src/App.tsx` | 添加 `/workplace` 路由 |
| `src/pages/MiniAppEntry.tsx` | 职场解压路由改为 `/workplace` |
| `src/pages/AwakeningSystemIntro.tsx` | 职场解压路由改为 `/workplace` |
| `src/components/energy-studio/AudienceHub.tsx` | 路由改为 `/workplace` |

### AI 对话组件

复用 MamaAIChat 模式，创建 `WorkplaceAIChat` 组件，系统提示词聚焦职场压力、倦怠、人际关系等场景。

