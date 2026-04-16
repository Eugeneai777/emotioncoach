

# 修复语音教练成本日志模型名错误（成本被高估 4 倍）

## 问题

`CoachVoiceChat.tsx` 第 609 行在记录成本时硬编码了 `gpt-4o-realtime-preview-2024-12-17`（标准模型，$40/$80 per M tokens），但实际所有边缘函数创建的会话都使用 `gpt-4o-mini-realtime-preview`（mini 模型，$10/$20 per M tokens）。

**后果**：所有历史语音成本记录都被高估了 4 倍，成本告警也因此频繁误触发（如截图中 ¥7.52 和 ¥20.36 的告警，实际应为 ¥1.88 和 ¥5.09）。

## 修改方案

| 文件 | 改动 |
|------|------|
| `src/components/coach/CoachVoiceChat.tsx` 第 609 行 | 将 `model: 'gpt-4o-realtime-preview-2024-12-17'` 改为 `model: 'gpt-4o-mini-realtime-preview'` |

仅改一行，修正后新的成本记录将使用正确的 mini 模型价格计算。

## 历史数据

已有的成本日志数据（全部记录为标准模型价格）均为虚高数据。如需修正历史记录，可后续通过数据库批量更新。

