

## 行业合伙人页面优化与简化

### 改动概览

简化行业合伙人详情页，移除重复信息，调整 Tab 标签为数字 1-4，Dashboard 统计卡片改为：总投放、总触达、总转化、总收入。

### 具体改动

**1. IndustryPartnerManagement.tsx - 简化顶部概览**
- 移除顶部 3 个 AdminStatCard（公司名称、一级佣金、推荐用户数），因为这些信息在 FlywheelGrowthSystem 中已有或不必要
- 移除合作备注区块
- 只保留返回按钮和标题（用公司名称作标题），然后直接渲染 FlywheelGrowthSystem

**2. FlywheelGrowthSystem.tsx - 多处优化**

a) **Dashboard 统计卡片**：将现有的 4 个统计卡（总触达、总转化、总收入、ROI）改为：
- 总投放（从 campaigns 的 promotion_cost 求和）
- 总触达（page_view + click 事件数）
- 总转化（payment + complete_test 事件数）  
- 总收入（已有）

b) **Tab 标签改为数字**：ResponsiveTabsTrigger 的 label 从 "📊 测评 & 工具" 改为 "1 测评&工具"，shortLabel 从 "L1" 改为 "1"，依此类推 2/3/4

c) **移除底部折叠区块**：去掉 "Campaign 管理"、"产品包管理"、"AI 活动分析" 三个 Collapsible 区块，简化页面

d) **Tab 内容区简化**：保留层级描述、统计数据、AI 定制按钮、推广活动列表

### 技术细节

**统计数据变更**：
- `totalStats` 结构从 `{ reach, conversions, revenue, roi }` 改为 `{ spend, reach, conversions, revenue }`
- `spend` 从 campaigns 表的 `promotion_cost` 字段聚合（已在 fetchStats 中查询，只需提取）
- 移除 ROI 计算

**Tab 标签**：
- FLYWHEEL_LEVELS 配置中的 icon 从 emoji 改为数字序号："1"、"2"、"3"、"4"
- shortLabel 直接用 "1"/"2"/"3"/"4"

**移除的组件引用**：
- 不再 import/使用 `PartnerCampaigns`、`PartnerProducts`、`AIActivityAnalysis`
- 移除 `campaignsOpen`、`productsOpen` 状态变量
