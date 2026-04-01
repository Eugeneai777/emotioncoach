

# 异常/退款卡片增加详细说明

## 问题

"异常/退款"卡片只显示数字（如 27）和异常率，无法得知具体是哪些记录构成了这个数字。用户需要知道异常的计算逻辑和具体明细。

## 方案

### 1. 获取异常记录详情

在 `fetchRealtimeMetrics` 中，除了已有的 count 查询，额外查询 `usage_records` 中 `record_type IN ('refund', 'compensation')` 的具体记录（limit 50），存入新状态 `errorDetails`。

### 2. 点击卡片展开详情面板

将"异常/退款" StatCard 改为可点击，点击后在卡片下方展开一个详情面板，包含：

- **计算说明**：「异常数 = 今日 usage_records 中 record_type 为 refund 或 compensation 的记录数；异常率 = 异常数 / 今日总调用数 × 100%」
- **按来源聚合的统计表**：按 `source`（如 ai_coaching、emotion_journal 等）分组，显示每个来源的异常数量
- **按类型分组**：refund vs compensation 各多少条
- **最近异常记录列表**（最多显示 20 条）：时间、来源(source)、类型(record_type)、用户ID（前8位）、金额(amount)、描述

### 3. 文件变更

| 文件 | 操作 |
|---|---|
| `src/components/admin/OperationsMonitorDashboard.tsx` | 新增 errorDetails 状态、查询逻辑、可点击卡片、展开面板 |

### 技术细节

- 新增状态 `errorDetails: Array<{...}>` 和 `showErrorDetails: boolean`
- 在 `fetchRealtimeMetrics` 中追加一个 select 查询（`source, record_type, user_id, amount, created_at, description`）
- StatCard 的"异常/退款"卡片外包一层 `onClick` 切换 `showErrorDetails`
- 展开面板用 `Collapsible` 或简单的条件渲染，放在 StatCard 行下方
- 不影响其他卡片和现有逻辑

