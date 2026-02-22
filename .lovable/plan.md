

## 优化 /partner 合伙人中心设计排版

### 问题分析

当前页面存在以下设计问题：

1. **颜色混乱** - 至少 6 种不同色系在同一页面竞争视觉焦点：
   - 橙色/琥珀色（PartnerOverviewCard、PartnerUpgradeCard、PartnerSelfRedeemCard、海报入口）
   - 青色/蓝绿色（PromotionHub、EntryTypeSelector 免费模式、推广指南提示）
   - 蓝色/靛蓝色（数据卡片、转化漏斗）
   - 绿色/翡翠色（余额、提现按钮）
   - 紫色/粉色（名额数据卡片）
   - 红色/橙色（过期提醒）

2. **间距松散** - 组件之间 `space-y-4` 加上每个组件自身的 padding，导致页面过长
3. **重复信息** - PartnerOverviewCard 和 CompactConversionFunnel 都展示学员数据；QuickActions 和 Tabs 功能重叠
4. **层次不清** - 每个组件都有自己的背景色和渐变，没有主次之分

### 设计方案

#### 统一色彩体系

有劲合伙人页面统一使用 **橙色系**（品牌色）作为主色调，辅以中性灰色：

| 元素 | 当前 | 优化后 |
|------|------|--------|
| 概览卡片头部 | 橙色渐变 ✓ | 保持不变 |
| 数据统计格 | 橙/绿/蓝/紫 4色 | 统一白底 + 橙色系文字 |
| 转化漏斗 | 蓝/橙/绿/紫 4色 | 统一橙色系深浅渐变 |
| 快捷操作 | 橙/青/蓝/绿 4色 | 删除（与 Tabs 重复） |
| 推广中心 | 青色/蓝绿色 | 改为白底 + 橙色点缀 |
| 自用兑换 | 琥珀/橙色 | 白底卡片 + 橙色按钮 |
| 入口设置 | 青+橙混合 | 白底 + 橙色高亮选中态 |
| 推广指南提示 | 青色背景 | 浅灰背景 + 橙色图标 |
| 提现按钮 | 绿色渐变 | 橙色渐变（统一品牌色） |

绽放合伙人保持 **紫色系** 作为品牌色。

#### 紧凑布局

1. **删除 PartnerQuickActions** - 4 个快捷操作与 3 个 Tab 功能完全重复，删除后减少一整行
2. **合并概览卡片** - 将 CompactConversionFunnel 内嵌到 PartnerOverviewCard 底部，减少一个独立卡片
3. **压缩间距** - 组件间距从 `space-y-4` 改为 `space-y-3`，内部 padding 统一减小
4. **压缩数据格** - 4 格统计数据改为更紧凑的行内展示，减少高度
5. **推广 Tab 内精简** - PromotionHub 和 EntryTypeSelector 功能合并，避免两个组件展示相同的入口设置

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/partner/YoujinPartnerDashboard.tsx` | 删除 QuickActions 引用、调整间距、内嵌漏斗 |
| `src/components/partner/PartnerOverviewCard.tsx` | 统一数据格颜色为橙色系、内嵌转化漏斗、压缩间距 |
| `src/components/partner/CompactConversionFunnel.tsx` | 颜色统一为橙色系深浅 |
| `src/components/partner/PromotionHub.tsx` | 背景改为白底、颜色改为橙色系 |
| `src/components/partner/EntryTypeSelector.tsx` | 颜色统一为橙色系 |
| `src/components/partner/PartnerSelfRedeemCard.tsx` | 背景改为白底卡片 |
| `src/components/partner/StoreCommissionProducts.tsx` | 微调保持一致 |

### 具体改动

#### 1. YoujinPartnerDashboard - 精简结构

- 删除 `PartnerQuickActions` 组件引用和导入
- 将 `CompactConversionFunnel` 从独立卡片移到 `PartnerOverviewCard` 内部
- 组件间距从 `space-y-4` 改为 `space-y-3`
- 删除推广 Tab 内的 `推广指南提示框`（teal 背景的"如何推广"区块）和 `AI 海报中心` 卡片入口（信息过多）

#### 2. PartnerOverviewCard - 统一配色 + 内嵌漏斗

- 4 格统计数据背景统一改为 `bg-muted/50`（浅灰），图标和数字保持橙色
- 移除每格不同的彩色渐变背景（orange-50、green-50、blue-50、purple-50 全改为统一的浅灰）
- 底部新增 CompactConversionFunnel 展示区
- 提现按钮颜色从绿色改为橙色渐变

#### 3. CompactConversionFunnel - 颜色统一

- 4 个圆形指标从蓝/橙/绿/紫改为橙色系的深浅层次：
  - 体验: `bg-orange-100 text-orange-500`
  - 入群: `bg-orange-200 text-orange-600`
  - 365: `bg-orange-300 text-orange-700`
  - 合伙人: `bg-amber-400 text-amber-800`

#### 4. PromotionHub - 去掉 teal 改橙色

- 卡片背景从 `from-teal-50 to-cyan-50 border-teal-200` 改为 `bg-white border`
- 图标背景从 `from-teal-400 to-cyan-500` 改为 `from-orange-400 to-amber-500`
- 标题文字从 `text-teal-800` 改为 `text-foreground`
- 按钮从 teal 渐变改为橙色渐变
- 名额标签保持语义色（有名额绿色、无名额红色）

#### 5. EntryTypeSelector - 统一橙色

- 免费模式选中态从 teal 改为橙色系的浅色调（`border-orange-400 bg-orange-50`）
- 勾选图标统一橙色
- 整体视觉与 PromotionHub 一致

#### 6. PartnerSelfRedeemCard - 白底

- 背景从 `from-amber-50 to-orange-50` 改为 `bg-white border`
- 按钮保持橙色渐变

### 无数据库改动

纯前端样式和布局调整，共改 6-7 个组件文件。

