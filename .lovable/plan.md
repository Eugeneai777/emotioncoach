

## 重构行业合伙人飞轮详情：四级增长飞轮系统

### 当前问题

现有飞轮详情页采用3个平铺 Tab（漏斗分析、Campaign 管理、产品包），结构扁平，无法体现产品层级关系。需要用**四级增长飞轮**作为主骨架重新组织。

### 新架构

去除现有 `PartnerFlywheel` 中的3-Tab 结构，替换为以四级飞轮为核心的统一页面：

```text
行业合伙人详情页
├── 顶部：合伙人信息卡片（保留现有）
└── 主区域：FlywheelGrowthSystem（替代 PartnerFlywheel）
    ├── 顶部总览条：总触达 | 总转化 | 总收入 | ROI
    ├── 四级飞轮纵向展示
    │   ├── L1 测评 & 工具（¥9.9~免费）
    │   │   ├── 摘要：触达数 / 转化率 / 收入
    │   │   └── 展开：该层级漏斗 + Campaign + AI落地页入口
    │   │       ↓ 升级转化率
    │   ├── L2 有劲训练营（¥299）
    │   │       ↓ 升级转化率
    │   ├── L3 绽放训练营（更高价位）
    │   │       ↓ 升级转化率
    │   └── L4 有劲合伙人（合伙人套餐）
    │
    └── 底部折叠区
        ├── Campaign 管理（复用 PartnerCampaigns）
        ├── 产品包管理（复用 PartnerProducts）
        └── AI 策略分析（复用现有 AI 分析按钮）
```

### 实现步骤

**步骤 1：数据库 — 创建 `partner_landing_pages` 表**

用于存储 AI 定制落地页数据：
- `id` (uuid), `partner_id` (uuid), `level` (text: L1/L2/L3/L4)
- `target_audience`, `pain_points` (text[]), `topics` (text[]), `channel`, `volume`
- `matched_product` (text), `content_a` (jsonb), `content_b` (jsonb)
- `selected_version` (text), `ai_conversation` (jsonb)
- `status` (text: draft/published), `landing_url` (text)
- RLS：管理员全权限，合伙人仅访问自身数据

**步骤 2：Edge Function — `flywheel-landing-page-ai`**

使用 Lovable AI (gemini-3-flash-preview)，支持 4 种模式：
- `match_product`：根据人群/痛点推荐引流产品
- `generate`：生成 A/B 两版落地页内容（标题、副标题、卖点、CTA）
- `optimize`：对话式优化内容
- `analyze`：分析活动数据 + 行业对标

**步骤 3：新建前端组件**

| 文件 | 职责 |
|------|------|
| `src/components/partner/FlywheelGrowthSystem.tsx` | 主组件，替代 PartnerFlywheel 在 IndustryPartnerManagement 中的位置。包含总览统计、4个可展开的层级卡片、底部折叠的 Campaign/产品/AI 分析 |
| `src/components/partner/FlywheelLevelCard.tsx` | 单个层级卡片：层级图标、名称、产品、摘要数据；展开后显示该层级的迷你漏斗 + AI 落地页向导入口 |
| `src/components/partner/AILandingPageWizard.tsx` | 4步 AI 向导 Dialog：输入人群信息 -> AI配对产品 -> AI生成A/B -> 对话编辑优化 |
| `src/components/partner/AIActivityAnalysis.tsx` | AI 分析面板：触达/转化/成交 + 行业对标 + AB优化建议 |

**步骤 4：修改 `IndustryPartnerManagement.tsx`**

第 11 行和第 210 行：将 `PartnerFlywheel` 替换为 `FlywheelGrowthSystem`

**步骤 5：保留 `PartnerFlywheel.tsx`**

不删除，因为合伙人前台页面 (`Partner.tsx` 第 245 行) 仍在使用它。

### 四级层级定义

```typescript
const FLYWHEEL_LEVELS = [
  {
    level: 'L1',
    name: '测评 & 工具',
    icon: '📊',
    description: '低门槛引流，获取用户数据',
    products: ['情绪健康测评', 'SCL-90', '财富卡点测评'],
    priceRange: '免费~¥9.9',
    color: 'blue',
  },
  {
    level: 'L2',
    name: '有劲训练营',
    icon: '🏋️',
    description: '深度体验，建立信任',
    products: ['21天情绪日记训练营', '财富觉醒训练营', '青少年困境突破营'],
    priceRange: '¥299',
    color: 'emerald',
  },
  {
    level: 'L3',
    name: '绽放训练营',
    icon: '🌸',
    description: '高价值转化，深度服务',
    products: ['绽放合伙人体系'],
    priceRange: '更高价位',
    color: 'purple',
  },
  {
    level: 'L4',
    name: '有劲合伙人',
    icon: '💎',
    description: '裂变增长，长期分成',
    products: ['初级合伙人', '高级合伙人', '钻石合伙人'],
    priceRange: '¥792~¥4950',
    color: 'amber',
  },
];
```

### 视觉效果

每个层级卡片采用左侧彩色竖线 + 图标 + 层级名称布局，层级间用带百分比的向下箭头连接，形成清晰的漏斗递进关系。点击某层级卡片，卡片在原位展开详情面板（使用 Collapsible 组件），无需页面跳转。

