

# 方案A补充：已购/已做测评不推荐

## 问题

用户从场景卡进入对话后，AI 会推荐对应测评。但如果用户已经购买或完成了该测评，推荐就显得多余甚至影响体验。

## 解决思路

在前端发送聊天请求时，查询用户已购买/已完成的测评列表，一并传给边缘函数。边缘函数在 system prompt 中告知 AI 哪些测评已完成，AI 就不会推荐这些测评。

## 数据来源

已购测评：`orders` 表，`status = 'paid'`，`package_key` 匹配以下值：
- `emotion_health_assessment` → 情绪健康
- `wealth_block_assessment` → 财富卡点
- `scl90_report` → SCL-90
- `women_competitiveness_assessment` → 35+女性竞争力

已完成测评：`partner_assessment_results` 表，按 `user_id` 查询是否有记录。

## 改动

### 1. `src/pages/YoujinLifeChat.tsx`
- 页面加载时，如果 URL 含 `topic` 参数，查询用户已购/已完成的测评 package_key 列表
- 将 `topic` 和 `completedAssessments` 数组一起传给边缘函数：
  ```json
  { "messages": [...], "topic": "anxiety", "completedAssessments": ["emotion_health_assessment"] }
  ```

### 2. `supabase/functions/youjin-life-chat/index.ts`
- 接收 `topic` 和 `completedAssessments` 参数
- 当 `topic` 存在时，追加场景引导指令到 system prompt
- 场景 → 测评映射：
  - `anxiety` → 情绪健康 `/emotion-health`
  - `career` → 35+女性竞争力 `/assessment/women_competitiveness`
  - `relationship` → SCL-90 `/assessment/scl90`
  - `wealth` → 财富卡点 `/wealth-block`
- 如果目标测评在 `completedAssessments` 中，prompt 指令改为「用户已完成该测评，不要推荐，可以推荐其他未完成的测评或直接引导到训练营」
- 如果所有测评都已完成，直接推荐 ¥399 训练营

### 3. `src/pages/MiniAppEntry.tsx`
- `useCases` 数组每项新增 `chatRoute` 字段
- 场景卡片加 `onClick` 和 `cursor-pointer`，点击导航到对应路由

### 4. `src/components/youjin-life/ChatBubble.tsx`
- `parseCards` 新增解析 `[ASSESSMENT]...[/ASSESSMENT]` 标记
- 渲染为可点击的测评推荐卡片（标题、描述、价格、跳转按钮）

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/pages/MiniAppEntry.tsx` | 场景卡加 chatRoute + onClick |
| `src/pages/YoujinLifeChat.tsx` | 读取 topic，查询已完成测评，传给边缘函数 |
| `supabase/functions/youjin-life-chat/index.ts` | 接收 topic + completedAssessments，动态调整推荐策略 |
| `src/components/youjin-life/ChatBubble.tsx` | 解析 [ASSESSMENT] 标记，渲染推荐卡片 |

