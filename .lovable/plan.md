

# 语音监控增加 usage_records 数据源（含豆包语音）

## 问题

当前"今日语音"和"24小时语音趋势"仅查询 `ai_coach_calls` 表，该表只记录 AI 主动发起的通话。用户通过各专区发起的 OpenAI Realtime 和豆包语音会话记录在 `usage_records` 表中（source 为 `realtime_voice`、`realtime_voice_emotion` 等），导致图表数据为空。

## 方案

在 `OperationsMonitorDashboard.tsx` 的 3 处语音查询中，额外查询 `usage_records` 中 source 包含 `realtime_voice` 的记录，将两个数据源合并。

### 具体变更

**1. 今日语音统计（~行 301-304）**

追加查询 `usage_records` 中 `source LIKE 'realtime_voice%'` 的记录，用 `amount` 字段（积分消耗）换算为大致秒数（8点/分钟 = 7.5秒/点），或直接显示通话次数+积分消耗。合并两个数据源的结果。

**2. 24小时趋势（~行 372-375）**

每小时循环中追加查询 `usage_records` 中语音相关 source 的记录，将 amount 累加到 voiceSeconds。

**3. 活跃用户语音统计（~行 450-454）**

同样追加 `usage_records` 语音记录到用户维度统计。

**4. 数据源标识**

在"今日语音"卡片的 sub 文案中区分显示：如 `OpenAI: X通 / 豆包: Y通`，让运营能区分两个通道的流量。

### 技术细节

- `usage_records` 中语音 source 值：`realtime_voice`（通用）、`realtime_voice_emotion`（豆包情绪）、`realtime_voice_identity`、`realtime_voice_life`
- 其中 `realtime_voice_emotion` 走豆包通道，其余走 OpenAI
- 使用 `.like('source', 'realtime_voice%')` 筛选
- `amount` 字段为扣减积分数，按 8点/分钟换算秒数：`seconds = (amount / 8) * 60`

### 文件变更

| 文件 | 操作 |
|---|---|
| `src/components/admin/OperationsMonitorDashboard.tsx` | 修改 3 处语音查询，合并 usage_records 数据 |

