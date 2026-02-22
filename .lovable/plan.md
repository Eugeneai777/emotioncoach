

## 优化 /partner 设计排版 - 第二轮

### 当前问题

上一轮优化已统一了 PartnerOverviewCard、CompactConversionFunnel、EntryTypeSelector、PartnerSelfRedeemCard 的颜色。但以下组件仍存在**颜色不统一**和**冗余**问题：

| 组件 | 问题 |
|------|------|
| `FixedPromoLinkCard` | 仍用 teal/cyan 背景和按钮（`from-teal-50 to-cyan-50`），与已优化的橙色系不一致 |
| `ConversionFunnel` | 漏斗条颜色为 蓝/橙/绿/紫 4色，应统一为橙色深浅 |
| `ConversionGuide` | 阶段标签使用 蓝/橙/绿/紫 4色，与漏斗不一致 |
| `ConversionAlerts` | 提醒框背景用 红/橙/绿/蓝/灰 5种，可简化 |
| `PartnerUpgradeCard` | 已到期/临期用红色渐变背景，正常升级用橙色渐变 -- 可接受但背景渐变可精简 |

### 改动方案

#### 1. FixedPromoLinkCard - teal 全改橙色

- 卡片背景：`from-teal-50 to-cyan-50 border-teal-200` -> `bg-white border`
- 图标背景：`from-teal-400 to-cyan-500` -> `from-orange-400 to-amber-500`
- 标题文字：`text-teal-800` -> `text-foreground`
- 链接框边框：`border-teal-100` -> `border-border`
- 链接文字：`text-teal-700` -> `text-foreground`
- 复制按钮：`text-teal-600 hover:bg-teal-100` -> `text-orange-600 hover:bg-orange-100`
- 操作按钮：`from-teal-500 to-cyan-500` -> `from-orange-500 to-amber-500`
- 二维码按钮：`border-teal-300 text-teal-700` -> `border-orange-300 text-orange-700`
- 底部说明：`text-teal-600` -> `text-muted-foreground`
- 紫色（财富测评）保持不变（紫色是该产品的语义色）
- QR 颜色：teal -> orange

#### 2. ConversionFunnel - 统一橙色渐变

漏斗条颜色从 4 色改为橙色系深浅：
- 兑换体验：`bg-blue-500` -> `bg-orange-200`（浅橙）
- 加入群聊：`bg-orange-500` -> `bg-orange-400`（中橙，保持）
- 购买365：`bg-green-500` -> `bg-orange-500`（标准橙）
- 成为合伙人：`bg-purple-500` -> `bg-amber-600`（深琥珀）

圆形图标背景同步调整。
整体转化率文字：`text-green-600` -> `text-orange-600`

#### 3. ConversionGuide - 统一橙色系

四阶段标签颜色统一：
- `text-blue-600 bg-blue-100` -> `text-orange-500 bg-orange-100`
- `text-orange-600 bg-orange-100` -> 保持
- `text-green-600 bg-green-100` -> `text-orange-600 bg-orange-100`
- `text-purple-600 bg-purple-100` -> `text-amber-700 bg-amber-100`

关键节点提示中：
- 高优先级背景：`bg-red-50` -> `bg-orange-50`，标题色改橙色
- 最佳时机 Badge：`bg-green-50 border-green-200` -> `bg-orange-50 border-orange-200`

#### 4. ConversionAlerts - 简化颜色

5 种提醒背景统一简化为 2 种：
- 高优先级（high）：保持 `border-red-200 bg-red-50/50`（红色有语义意义：紧急）
- 中/低优先级（medium/low）：统一为 `border-orange-200 bg-orange-50/50`

即：蓝色（转化时机）、绿色（毕业）、灰色（长期未活跃）全部改为橙色。

无状态 "暂无需要跟进" 卡片：`border-green-200 bg-green-50/30` -> `border-border bg-muted/30`

#### 5. PartnerUpgradeCard - 精简背景

- 升级引导：`border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50` -> `bg-white border-orange-200`
- 提示条：`bg-amber-100/50` -> `bg-orange-50`
- 过期/临期状态保持红色/琥珀色（语义色，不改）

### 涉及文件

| 文件 | 改动量 |
|------|--------|
| `src/components/partner/FixedPromoLinkCard.tsx` | 中 - teal 全改 orange |
| `src/components/partner/ConversionFunnel.tsx` | 小 - 4 个颜色值 |
| `src/components/partner/ConversionGuide.tsx` | 小 - 标签和 badge 颜色 |
| `src/components/partner/ConversionAlerts.tsx` | 小 - 提醒框背景色 |
| `src/components/partner/PartnerUpgradeCard.tsx` | 小 - 背景渐变精简 |

### 无数据库改动

纯前端样式调整，共改 5 个文件。

