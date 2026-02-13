

# 有劲AI · 转化飞轮中控台 — 实施方案

## 概述

在现有管理后台（/admin）中新增"转化飞轮"模块，复用已有的 `conversion_events`、`orders`、`partners` 表，仅新建 `campaigns` 和 `ab_tests` 两张表。通过 Lovable AI 实现智能分析功能。

---

## 一、数据库变更

### 新建表 1：campaigns（推广活动）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 活动ID |
| name | text | 活动名称 |
| traffic_source | text | 流量来源（微信/抖音/小红书等） |
| target_audience | text | 目标人群 |
| media_channel | text | 媒体渠道 |
| landing_product | text | 引流产品 |
| promotion_cost | numeric | 推广成本 |
| start_date | date | 开始日期 |
| end_date | date | 结束日期 |
| status | text | draft/active/paused/completed |
| created_at / updated_at | timestamptz | 时间戳 |

### 新建表 2：ab_tests（AB测试）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 测试ID |
| campaign_id | uuid FK | 关联活动 |
| title_a | text | 标题A |
| title_b | text | 标题B |
| clicks_a | integer | A点击数 |
| clicks_b | integer | B点击数 |
| winner | text | 优胜版本(a/b/pending) |
| ai_suggestion | text | AI生成的优化建议 |
| status | text | running/completed |
| created_at | timestamptz | 时间戳 |

### 扩展现有表

- `conversion_events`：新增 `campaign_id` 字段（可选，用于归因到具体活动）

### 复用现有表（不改动）

- `orders`：已有金额、用户、产品、合伙人ID等字段
- `partners`：已有邀请人数、成交、收入、分成等字段
- `profiles`：用户基础信息
- `user_camp_purchases`：训练营购买记录

---

## 二、管理后台导航

在 AdminSidebar 中新增"转化飞轮"分组：

```text
转化飞轮
  ├── 飞轮总览        /admin/flywheel
  ├── Campaign实验室   /admin/flywheel-campaigns
  ├── 漏斗行为追踪     /admin/flywheel-funnel
  ├── 收入与ROI       /admin/flywheel-revenue
  ├── 裂变追踪        /admin/flywheel-referral
  └── AI策略中心      /admin/flywheel-ai
```

---

## 三、6个页面功能设计

### 页面1：飞轮总览 Dashboard

- 顶部4个统计卡片：今日曝光、今日测评完成、今日成交金额、总ROI
- 中部：实时漏斗图（曝光 -> 点击 -> 测评完成 -> AI>=5轮 -> 咨询 -> 成交）
- 底部：AI一句话诊断（调用 Lovable AI 生成）
- 数据来源：聚合 `conversion_events` + `orders` 表

### 页面2：Campaign实验室

- CRUD管理推广活动（campaigns 表）
- 每个 Campaign 展示关联的漏斗数据和ROI
- 支持按状态筛选、按时间排序
- 集成 AB 测试创建入口

### 页面3：漏斗行为追踪

- 基于现有 `ConversionAnalytics` 组件扩展
- 增加 Campaign 维度筛选
- 自动计算：点击率、测评完成率、咨询率、成交率
- 支持按日/周/月查看趋势

### 页面4：收入与ROI分析

- 从 `orders` 表聚合收入数据
- 按 Campaign 分组显示 ROI = 总收入 / 推广成本
- LTV 计算 = 单用户平均收入
- 产品转化排名图表

### 页面5：裂变追踪

- 复用现有 `partners` 表数据
- 合伙人贡献排名表格
- 裂变链路可视化（邀请 -> 注册 -> 成交）
- 分成统计

### 页面6：AI策略中心

- "生成分析"按钮触发 Edge Function
- Edge Function 读取最近7天的漏斗数据 + 订单数据
- 调用 Lovable AI（google/gemini-3-flash-preview）生成：
  - 最弱环节识别
  - 最优流量来源
  - 3个优化建议
  - 2个AB测试方向
  - 价格/产品结构建议
  - 下周增长预测
- 结果以卡片形式展示，支持历史记录查看

---

## 四、Edge Function

### `flywheel-ai-analysis`

- 从数据库读取7天内 conversion_events、orders、campaigns 数据
- 组装成结构化 prompt
- 调用 Lovable AI Gateway（https://ai.gateway.lovable.dev/v1/chat/completions）
- 使用 tool calling 提取结构化输出（最弱环节、建议列表等）
- 返回 JSON 给前端渲染

---

## 五、共振指数（高级功能）

在 Dashboard 中增加共振指数计算：

```text
共振指数 = AI对话轮数 x 测评完成度 x 情绪深度评分
```

从 `usage_records`（对话轮数）+ `conversion_events`（测评完成度）聚合计算，用于用户分层预测。

---

## 六、自动报告

- 在 AI 策略中心增加"生成周报"功能
- 调用同一个 Edge Function，prompt 切换为周报模式
- 输出：漏斗分析、合伙人排名、产品转化排名、策略建议
- 以 Markdown 格式渲染，支持复制

---

## 七、权限控制

- 仅 `admin` 角色可访问全部飞轮页面
- 复用现有 AdminLayout 的角色校验逻辑
- 合伙人通过现有的 `/partner` 页面查看自己的数据（已有功能）

---

## 八、实施步骤

1. 创建 `campaigns` 和 `ab_tests` 数据库表 + RLS 策略
2. 扩展 `conversion_events` 表增加 `campaign_id` 字段
3. 创建 `flywheel-ai-analysis` Edge Function
4. 创建6个页面组件（使用统一的 AdminPageLayout 等共享组件）
5. 更新 AdminSidebar 和 AdminLayout 路由
6. 集成 AI 分析和周报生成功能

