

# 行业合伙人飞轮完整升级 — 自定义产品包 + Landing Page + 自由漏斗步骤 + 数据隔离

## 目标

让每个行业合伙人（如知乐）可以：
1. 管理自己的产品包，配置外部落地页链接
2. 为每个 Campaign 设定专属外部 Landing Page
3. **自由定义漏斗步骤**（不限6步，可以是3步、5步、8步，步骤名称和事件 key 都可自定义）
4. 只看到自己 Campaign 下的转化数据

## 数据库现状

- `campaigns` 表：无 `landing_page_url`、无 `custom_funnel_steps`
- `partner_products` 表：无 `landing_page_url`
- `conversion_events` 表：有 `event_type`（text）和 `campaign_id`，已支持按 campaign 过滤

---

## 实施步骤

### 第一步：数据库迁移

为 `campaigns` 表新增：

| 字段 | 类型 | 说明 |
|------|------|------|
| `landing_page_url` | TEXT | 外部落地页 URL |
| `custom_funnel_steps` | JSONB | 自定义漏斗步骤数组，不限步数 |

为 `partner_products` 表新增：

| 字段 | 类型 | 说明 |
|------|------|------|
| `landing_page_url` | TEXT | 产品专属外部落地页 |

`custom_funnel_steps` 结构（数组长度不限）：
```text
[
  {"key": "page_view", "label": "落地页访问"},
  {"key": "click", "label": "点击CTA"},
  {"key": "complete_test", "label": "完成测评"},
  {"key": "payment", "label": "成交"}
]
```

合伙人可以自由增删步骤，每个步骤由 `key`（对应 `conversion_events.event_type`）和 `label`（显示名称）组成。

### 第二步：PartnerProducts 增强

修改 `src/components/partner/PartnerProducts.tsx`：
- 表单新增「落地页 URL」输入框，提示填写外部网站链接
- 表格新增落地页列（可点击跳转，带外链图标）

### 第三步：PartnerCampaigns 增强

修改 `src/components/partner/PartnerCampaigns.tsx`：
- 表单新增「落地页 URL」输入框（外部链接）
- 新增「漏斗步骤配置」区域：
  - 提供几个常用预设模板可一键填充（如"标准6步"、"简化3步"）
  - 动态添加/删除步骤行，每行包含 `key`（事件标识）和 `label`（显示名称）
  - 可拖拽排序或上下移动
  - 无固定步骤数上限
- 新增「关联产品」下拉

### 第四步：PartnerFlywheel 完整重构

修改 `src/components/partner/PartnerFlywheel.tsx`：

**UI 重构为 Tabs 布局：**
- Tab 1「漏斗分析」
- Tab 2「Campaign 管理」（嵌入增强后的 PartnerCampaigns）
- Tab 3「产品包」（嵌入增强后的 PartnerProducts）

**漏斗分析 Tab 功能：**
- Campaign 下拉筛选器（全部 / 单个 Campaign）
- **动态漏斗图**：根据选中 Campaign 的 `custom_funnel_steps` 渲染任意步数的梯形漏斗
  - 查询 `conversion_events` 按该合伙人的 `campaign_id` 过滤
  - 按每个步骤的 `key` 统计事件数
  - 计算相邻步骤间的环节转化率
  - 漏斗图高度和颜色梯度自动适配步骤数量
- 统计卡片（曝光、成交、收入、ROI）
- AI 最弱环节诊断（转化率最低的环节）
- 「AI 策略分析」按钮：调用 `flywheel-ai-analysis` 边缘函数，传 `partner_id`

### 数据隔离

已由现有架构保证：
- `campaigns.partner_id` 筛选自己的活动
- `conversion_events.campaign_id` 筛选自己活动的事件
- `partner_products.partner_id` 筛选自己的产品
- 合伙人永远看不到其他合伙人或全平台的数据

### 涉及文件

| 文件 | 改动 |
|------|------|
| 数据库迁移 | `campaigns` +2字段，`partner_products` +1字段 |
| `src/components/partner/PartnerProducts.tsx` | 新增落地页 URL 字段 |
| `src/components/partner/PartnerCampaigns.tsx` | 新增落地页 URL、动态漏斗步骤配置器、关联产品下拉 |
| `src/components/partner/PartnerFlywheel.tsx` | Tabs 布局 + 动态漏斗图 + AI 诊断 + AI 策略分析 |

