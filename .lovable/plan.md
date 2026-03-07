

## 页面排版优化方案

### 问题分析

当前页面存在以下排版问题：
- **合伙人仪表板（IndustryPartnerDashboard）**：7个Tab挤在一行，文字极小，移动端几乎无法点击
- **管理员详情页（IndustryPartnerDetail）**：16个Tab分4组，桌面端溢出，Tab栏过于拥挤
- **子组件内部**：Card嵌套Card（如PartnerMarketingHub内部再嵌Tabs），层级过多导致视觉拥挤
- **间距不一致**：各组件spacing混乱，有的`space-y-4`有的`space-y-3`

### 优化方案

#### 1. 合伙人仪表板（IndustryPartnerDashboard.tsx）
- **移动端**：将7个Tab改为 `Select` 下拉菜单（与admin详情页一致），分组显示：
  - 内容工具：AI教练、测评
  - 营销增长：AI文案、营销活动、渠道归因
  - 运营管理：跟进提醒、培训中心
- **桌面端**：保留TabsList但分组显示，组间用Separator分隔，增大触控区域

#### 2. 管理员详情页（IndustryPartnerDetail.tsx）
- 桌面端Tab栏增加`gap`和`py`让触控区域更大
- 组标签在Tab栏上方显示为小字分组标题，而非全部塞进一行

#### 3. 子组件排版统一
- **PartnerMarketingHub**：移除外层多余`space-y-4`，类型选择器从`grid-cols-2`改为横向滚动`flex`布局（移动端），减少Card嵌套
- **PartnerChannelAttribution**：统计卡片从纵向堆叠改为`grid-cols-2`紧凑网格，图表区域增加最小高度
- **PartnerFollowupReminders**：设置区与提醒列表用清晰的Section标题分隔
- **PartnerTrainingCenter**：资源列表增加适当间距，折叠内容区限制最大高度

#### 4. 全局间距规范
- 顶层容器统一`space-y-6`
- 组件内部统一`space-y-4`
- Card内部`p-4`，移除不必要的CardHeader/CardContent嵌套

### 涉及文件

| 文件 | 改动 |
|------|------|
| `IndustryPartnerDashboard.tsx` | 移动端改Select下拉，桌面端分组+Separator |
| `IndustryPartnerDetail.tsx` | 优化Tab栏间距和分组视觉 |
| `PartnerMarketingHub.tsx` | 减少嵌套层级，优化类型选择器布局 |
| `PartnerChannelAttribution.tsx` | 统计卡片改为grid网格 |
| `PartnerFollowupReminders.tsx` | Section分隔优化 |
| `PartnerTrainingCenter.tsx` | 资源列表间距优化 |

