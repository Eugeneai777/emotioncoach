

# 点数明细体验优化：筛选 + 产品名称中文化 + 训练营名称关联

## 三个问题

1. **没有筛选**：用户想看"充了多少"或"花了多少"，必须逐条翻找
2. **训练营免费额度没有营名**：只显示"训练营免费额度"，不知道是哪个营
3. **source 显示技术术语**：`voice_chat`、`courses_page`、`recommend_courses_v2`、`camp_video_tasks`、`web`、`batch_gratitude_analysis` 等对用户毫无意义

## 方案

### 1. 前端：增加筛选切换（全部 / 消费 / 充值）

在汇总条下方增加 3 个轻量 Tab 按钮：

```text
[ 全部 ]  [ 消费 ]  [ 充值 ]
```

- **全部**：显示所有记录
- **消费**：`amount <= 0`（扣费 + 免费额度）
- **充值**：`amount > 0`（购买、注册赠送、退款、补偿）

纯前端过滤，不增加查询。

### 2. 前端：完善 source → 产品名称映射表

当前 `SOURCE_LABELS` 仅覆盖 11 个 key。数据库中实际有 30+ 种 source。需要补全：

| source（技术key） | 用户看到的名称 |
|---|---|
| `voice_chat` | 语音通话 |
| `voice_chat_refund` | 语音通话退款 |
| `text_chat` / `web` / `mysql` | 文字对话 |
| `voice_to_text` | 语音转文字 |
| `text_to_speech` | 文字转语音 |
| `courses_page` / `recommend_courses` / `recommend_courses_v2` / `video_recommendations` / `camp_video_tasks` | 课程推荐 |
| `emotion_coach_session` | 情绪教练 |
| `wealth_coach_session` | 财富教练 |
| `communication_coach_session` | 沟通教练 |
| `vibrant_life_coach_session` | 生活教练 |
| `parent_coach_session` | 亲子教练 |
| `generate_checkin_image` | 打卡图片生成 |
| `generate_poster_image` | 海报生成 |
| `generate_story_coach` | AI故事教练 |
| `batch_gratitude_analysis` / `analyze_tag_trends` / `analyze_emotion_patterns` / `analyze_parent_emotion_patterns` | 情绪分析 |
| `generate_emotion_review` | 情绪报告 |
| `registration` | 注册赠送 |
| `purchase_basic` | 购买尝鲜会员 |
| `system_refund` | 系统补偿 |

### 3. 优化 description 显示

当前 description 里有大量 `"voice_chat -8点"` 这样的技术文本。前端渲染时用已映射的中文产品名替换 description 中的技术术语，不依赖后端修改。

逻辑：如果 `description` 包含 source 原始 key（如 `voice_chat -8点`），替换为中文名称（如 `语音通话 -8点`）。对于"训练营免费额度"这类，追加 source 对应的产品名，例如 `训练营免费额度 · 情绪教练`。

### 不涉及的改动

- **不修改数据库**：不改表结构、不写迁移
- **不修改后端函数**：所有优化纯前端
- **不影响其他页面**：仅改 `VoiceUsageSection.tsx`

## 文件清单

| 文件 | 改动 |
|------|------|
| `src/components/VoiceUsageSection.tsx` | 补全映射表 + 增加筛选Tab + 优化描述文本 |

单一文件改动，约 40 行新增/修改。

