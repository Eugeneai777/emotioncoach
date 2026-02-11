

## 修复使用记录中文显示并简化界面

### 问题

使用记录（"📋 使用"标签页）中的 `source` 和 `record_type` 显示为英文原始值，因为数据库中实际存储的值（如 `generate_story_coach`、`conversation`、`compensation` 等）未在中文映射表中覆盖。

### 数据库实际值

| 字段 | 数据库实际值 |
|------|-------------|
| record_type | `conversation`, `refund`, `compensation` |
| source | `generate_story_coach`, `analyze_parent_emotion_patterns`, `batch_gratitude_analysis`, `system_refund`, `wealth_coach_session`, `mysql`, `video_recommendations`, `analyze_tag_trends`, `voice_chat`, `text_to_speech`, `web`, `voice_chat_refund`, `emotion_coach_session`, `analyze_emotion_patterns`, `parent_coach_session`, `courses_page`, `voice_to_text`, `generate_poster_image`, `communication_coach_session`, `vibrant_life_coach_session`, `generate_checkin_image`, `recommend_courses` |

### 改动内容

**文件：`src/components/admin/UserDetailDialog.tsx`**

1. **扩展 `getRecordTypeName` 映射**：增加 `conversation`（对话）、`compensation`（补偿）等缺失类型
2. **扩展 `getSourceName` 映射**：将所有数据库中出现的 source 值补全中文翻译
3. **简化使用记录卡片**：移除 metadata 的 JSON 原始展示（对管理员无意义），让界面更清爽
4. **简化标题**：将"详细使用记录（最近100条）"改为"使用记录"

### 新增映射表

**record_type 映射：**
- `conversation` -> 对话
- `compensation` -> 补偿
- `deduction` -> 扣费
- `refund` -> 退款
- `recharge` -> 充值
- `bonus` -> 赠送
- `consumption` -> 消耗

**source 映射（新增部分）：**
- `generate_story_coach` -> 故事教练
- `analyze_parent_emotion_patterns` -> 亲子情绪分析
- `batch_gratitude_analysis` -> 感恩分析
- `system_refund` -> 系统退款
- `wealth_coach_session` -> 财富教练
- `mysql` -> 对话
- `web` -> 网页对话
- `video_recommendations` -> 视频推荐
- `analyze_tag_trends` -> 标签趋势分析
- `text_to_speech` -> 文字转语音
- `voice_to_text` -> 语音转文字
- `emotion_coach_session` -> 情绪教练
- `analyze_emotion_patterns` -> 情绪模式分析
- `parent_coach_session` -> 亲子教练
- `courses_page` -> 课程页面
- `generate_poster_image` -> 生成海报
- `communication_coach_session` -> 沟通教练
- `vibrant_life_coach_session` -> 有劲教练
- `generate_checkin_image` -> 生成打卡图
- `recommend_courses` -> 课程推荐
- `voice_chat_refund` -> 语音退款

### 简化内容

- 移除 metadata JSON 显示（第531-535行）
- 标题从"详细使用记录（最近100条）"简化为"使用记录"

