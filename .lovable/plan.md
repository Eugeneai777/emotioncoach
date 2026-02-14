

## 四级飞轮 Tab 化 + 推广活动优化

### 改动概览

将四级增长飞轮从纵向瀑布式（Collapsible 卡片 + 升级箭头）改为水平 Tab 切换布局，简化每个层级的内容展示（移除关联产品），并在推广活动列表中直接显示点击数和购买数。

### 具体改动

**1. FlywheelGrowthSystem.tsx - 改为 Tab 布局**
- 用 `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` 替代当前的纵向 `FlywheelLevelCard` 列表
- 四个 Tab：L1 测评&工具、L2 有劲训练营、L3 绽放训练营、L4 有劲合伙人
- 移动端使用 `ResponsiveTabsTrigger` 显示短标签（L1/L2/L3/L4）
- 移除层级间的升级箭头
- 每个 Tab 内容区直接展示：层级描述、数据统计（触达/转化/收入）、AI 定制按钮、推广活动列表
- 不再使用 `FlywheelLevelCard` 组件

**2. FlywheelLevelCard.tsx - 简化或不再使用**
- Tab 内容面板直接在 `FlywheelGrowthSystem.tsx` 中渲染，不再需要 Collapsible 和关联产品展示

**3. PartnerLandingPageList.tsx - 增加点击数和购买数**
- 查询 `conversion_events` 表，按每个推广活动的 landing page id 聚合：
  - 点击数：`event_type` 为 `click` 或 `page_view` 的记录数
  - 购买数：`event_type` 为 `payment` 的记录数
- 由于 `conversion_events` 没有直接的 `landing_page_id` 字段，通过 `campaign_id` 关联或使用 metadata 中的信息匹配（如无直接关联，先显示为 0，后续可扩展）
- 列表项布局调整：标题行 + 第二行显示受众、点击数（👁 图标）、购买数（💰 图标）、日期
- 移除 `matched_product` 的显示

### 技术细节

- Tab 组件使用已安装的 `@radix-ui/react-tabs`
- 移动端 Tab 使用 `ResponsiveTabsTrigger` 显示短文字
- 推广活动的点击/购买数暂时使用模拟数据（0），因为 `conversion_events` 表与 `partner_landing_pages` 之间没有直接的外键关联。后续可通过添加 `landing_page_id` 字段到 `conversion_events` 表来实现真实数据追踪
- 顶部汇总统计卡片保持不变
- 底部 Campaign 管理、产品包管理、AI 活动分析保持不变

