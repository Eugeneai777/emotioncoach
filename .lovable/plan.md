

## 轮播图实施方案

### 位置：已购快捷面板之后、个性化欢迎语之前（行344-346之间）

未登录用户：轮播图紧跟人群网格，无拥挤问题。已购用户：快捷面板（44px 高）+ 轮播图（140px 高），两者间距 `pb-3` 保持呼吸感。

### 三张轮播图配置

| 序号 | 文案 | 渐变色 | 点击行为 |
|------|------|--------|---------|
| 1 | 🎯 找到你的卡点 · 科学定位突破方向 | violet→indigo | 弹出 AssessmentPickerSheet（复用已有4个测评） |
| 2 | 🌸 7天情绪解压 · 找回内心平静 | rose→pink | `navigate('/promo/synergy')` |
| 3 | 💪 知乐双效解压 · 身心协同修复 | blue→cyan | `navigate('/promo/zhile-havruta')` |

### 技术实现

**改动文件**：仅 `src/pages/MiniAppEntry.tsx`

- 使用 `embla-carousel-react`（已安装）+ `useEffect` + `setInterval` 实现 3 秒自动轮播（不额外安装 autoplay 插件）
- 底部 3 个圆点指示器，当前高亮
- 卡片高度 140px，`rounded-2xl`，移动端全宽、桌面端跟随父容器 max-width
- 测评卡片点击复用现有 `setPickerAssessments` + `setPickerOpen(true)`，弹出包含全部 4 个测评的选择弹窗
- AssessmentPickerSheet 弹窗内测评排序：中场觉醒力 → 35+女性竞争力 → 财富卡点 → 情绪健康（专业版在前，侧重中年男性 + 35+女性痛点转化）

### 不涉及

- 数据库、支付、计分逻辑：零改动
- 其他页面：零改动
- 新依赖安装：无

