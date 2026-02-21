

## 在财富教练及相关页面推广和分享财富测评卡片

### 目标

在财富教练页面（介绍页 + 对话页）及其他相关页面增加财富测评推广分享入口，让用户可以方便地生成推广海报分享给朋友。

### 现状分析

| 页面 | 路由 | 当前是否有分享入口 |
|------|------|-----|
| 训练营打卡页 | `/wealth-camp-checkin` | 已有 WealthInviteCardDialog |
| 财富测评页 | `/wealth-block` | 已有 WealthInviteCardDialog |
| 财富教练介绍页 | `/wealth-coach-intro` | 仅有 IntroShareDialog（分享页面链接），无推广海报 |
| 财富教练对话页 | `/wealth-coach-chat` | 无分享入口 |
| 测评结果组件 | WealthBlockResult | 有 ShareInfoCard（信息卡片），无推广海报 |
| 毕业证页面 | `/partner/camp-graduate` | 已有 WealthInviteCardDialog |

### 方案

在以下 2 个页面新增财富测评推广海报分享入口：

---

**1. 财富教练介绍页 (`/wealth-coach-intro`)**

- 位置：在"财富觉醒3部曲"的第一步"财富卡点测评"卡片旁，或在页面底部 CTA 区域添加分享按钮
- 实现：添加一个"分享测评海报"按钮，点击打开 `WealthInviteCardDialog`，默认 Tab 为 `promo`
- 按钮样式：小型分享图标按钮，不打扰主流程

**2. 财富教练对话页 (`/wealth-coach-chat`)**

- 位置：在 `CoachLayout` 的页面顶部操作区（与"新对话"按钮同级），添加一个分享图标按钮
- 实现：在页面中引入 `WealthInviteCardDialog`，点击分享按钮打开对话框
- 注意：需要检查 `CoachLayout` 是否支持额外的 header action 按钮

### 改动文件

| 文件 | 类型 | 改动 |
|------|------|------|
| `src/pages/WealthCoachIntro.tsx` | 修改 | 在页面底部 CTA 区或3部曲区域添加分享按钮 + WealthInviteCardDialog |
| `src/pages/WealthCoachChat.tsx` | 修改 | 添加分享按钮 + WealthInviteCardDialog |

### 技术细节

- 两处均复用现有的 `WealthInviteCardDialog` 组件，`defaultTab='promo'`
- 分享按钮使用 `Share2` 图标 + 简短文案（如"推荐测评"）
- 对话页需检查 `CoachLayout` 组件是否支持自定义 header 右侧操作按钮，若不支持则使用浮动按钮或放在对话区域上方

共 2 个文件修改，无新建文件，无数据库改动。

