

## 推广活动列表优化

### 改动内容

**1. 按钮文案更新 (`FlywheelGrowthSystem.tsx`)**
- "设置推广活动" 改为 "建立推广活动"

**2. 推广活动列表重新排版 (`PartnerLandingPageList.tsx`)**

当前每个活动占两行（标题 + 受众/数据/日期），改为紧凑的单行布局，专注数据展示：

```text
标题(truncate)  投放 0  观看 4  购买 0  ¥0  2/14  [草稿]  >
```

具体改动：
- 标题和所有数据指标在同一行水平排列
- 去掉 target_audience 显示（详情页已有）
- 新增"投放"指标（从 campaigns 表 promotion_cost 获取，或暂用 0 占位）
- 新增"金额"指标（购买产生的收入）
- 日期从 `2026/2/14` 简化为 `2/14` 格式（省略年份）
- 保留状态标签和箭头图标

### 技术细节

**文件修改**：
- `src/components/partner/FlywheelGrowthSystem.tsx` - 第 277 行按钮文案
- `src/components/partner/PartnerLandingPageList.tsx` - 列表项布局重构为单行，日期格式简化为 `M/D`
