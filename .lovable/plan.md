## 三档解锁方案

| 档位 | 触发 | 卡片 | 入口按钮 |
|---|---|---|---|
| **基础款** | 冥想 或 对话 任一完成 | 暗色金线 + 日期 + 一句鼓励 | 「先看一眼今天的卡片」 |
| **进阶款** | 冥想 + 对话 都完成 | 暗色金边 + quote + coachReply（如分享了反思，多一行手写体反思） | 「看看今天的卡片」（金色高亮） |
| **七日烫金款** | 第 7 天 + 进阶款已解锁 | 深色烫金 + 七日勋章 + "唯一一个真的走完的人" | 「收下你的七日卡」（带闪烁） |

反思分享 = 加分项，不作触发条件，分享后给 tier ≥ 2 的卡片"加厚"一行。

## 改动范围

1. **`src/pages/CampCheckIn.tsx`**
   - 计算 `cardTier`：0 不显示 / 1 基础 / 2 进阶 / 3 七日烫金
   - 入口按钮文案、颜色、动效随 tier 切换
   - tier、has_shared_to_community 透传给 `DailyShareCard`

2. **`src/components/camp-checkin/DailyShareCard.tsx`**
   - 新增 props：`tier: 1 | 2 | 3`、`hasReflection: boolean`、`reflectionText?: string`
   - tier=1：极简版（仅日期 + LOGO + 鼓励语，**不显示** quote/coachReply）
   - tier=2：现常规版（quote + coachReply）；若 hasReflection=true，底部多一行手写体反思
   - tier=3：烫金 + 七日勋章 + 收官文案
   - 标题/边框/背景按 tier 切换

## 不改动

- 数据库、路由、价格、套餐 key、售前页文案、测评。

确认即开工。
