

## 重新规划 /partner 合伙人中心页面 - 第三轮优化

### 当前问题诊断

经过前两轮颜色统一优化后，颜色已基本统一为橙色系。但页面仍存在以下**结构性和设计问题**：

#### 1. 推广 Tab 内容严重冗余

推广 Tab 包含 3 个独立卡片，功能高度重叠：

| 组件 | 功能 |
|------|------|
| `PartnerSelfRedeemCard` | 入口方式无关，独立兑换操作 |
| `EntryTypeSelector` | 选择免费/付费 + 体验包内容 + 链接预览 + 保存按钮 |
| `FixedPromoLinkCard` | 显示链接 + 复制/二维码/海报按钮 |

问题：`EntryTypeSelector` 和 `FixedPromoLinkCard` 都显示推广链接、都有复制功能、都显示入口方式。而 `PromotionHub`（绽放合伙人用）已经是合并版本，但有劲合伙人仍然分成了 3 个卡片。

#### 2. 收益 Tab 颜色仍不统一

`PartnerAnalytics` 组件中：
- 分享效果统计：紫色(`bg-purple-50`)、绿色(`bg-green-50`)、蓝色(`bg-blue-50`)、琥珀色(`bg-amber-50`) 4 种背景色
- 转化率分析条：蓝(`bg-blue-500`)、青(`bg-teal-500`)、绿(`bg-green-500`) 3 种颜色
- 本月收益文字：`text-green-600`（应为橙色）
- 趋势图图标：`text-blue-500`
- 佣金明细中的金额：`text-green-600`

#### 3. 概览卡片过于复杂

`PartnerOverviewCard` 包含：等级头 + 到期提示 + 4 格数据 + 提现按钮 + 转化漏斗 = 6 个区域，垂直高度占据大量屏幕空间。

#### 4. 学员 Tab 组件过多

学员 Tab 包含 5 个组件：`ConversionAlerts` + `ConversionFunnel` + `ConversionGuide` + 群管理折叠区 + `StudentList`。ConversionGuide 是静态教学内容，每次进入都显示，实际使用后不再需要。

### 优化方案

#### A. 推广 Tab - 合并为一个卡片

将 `EntryTypeSelector` 和 `FixedPromoLinkCard` 的功能合并，直接在 `YoujinPartnerDashboard` 中用 `PromotionHub` 替代两者（`PromotionHub` 已经是合并版本）。

改动：
- `YoujinPartnerDashboard.tsx` 推广 Tab 内容改为：
  1. `PartnerSelfRedeemCard`（自用兑换，保留）
  2. `PromotionHub`（已有合并版本，替代 EntryTypeSelector + FixedPromoLinkCard）
- 删除推广 Tab 中对 `EntryTypeSelector` 和 `FixedPromoLinkCard` 的引用

#### B. 收益 Tab - 颜色统一

**PartnerAnalytics.tsx**：
- 分享效果统计 4 格背景统一：`bg-purple-50` / `bg-green-50` / `bg-blue-50` / `bg-amber-50` 全改为 `bg-orange-50`
- 对应文字颜色：紫/绿/蓝/琥珀全改为 `text-orange-700`
- 分享效果标题图标：`text-purple-500` 改为 `text-orange-500`
- 趋势图标题图标：`text-blue-500` 改为 `text-orange-500`
- 转化率分析条颜色：蓝/青/绿全改为橙色系深浅（`bg-orange-300` / `bg-orange-400` / `bg-orange-500`）
- 本月收益文字：`text-green-600` 改为 `text-orange-600`

**CommissionHistory.tsx**：
- 佣金金额：`text-green-600` 改为 `text-orange-600`

#### C. 概览卡片精简

**PartnerOverviewCard.tsx**：
- 将 4 格数据从 `grid-cols-4` 改为 2 行紧凑展示（2 x 2 水平行），减少高度
- 移除每格的图标（用文字标签足够），让数字更突出
- 到期提示与等级条合并（到期信息直接显示在等级条右下角而非独立横幅）

#### D. 学员 Tab 精简

**YoujinPartnerDashboard.tsx**：
- `ConversionGuide` 移到折叠状态（默认不展开），与"群管理"合并为一个"工具与指南"折叠区
- 调整顺序：`ConversionAlerts`（跟进提醒） -> `StudentList`（学员列表） -> `ConversionFunnel`（漏斗，移到学员列表下方作为补充分析） -> 工具指南折叠区

### 涉及文件

| 文件 | 改动 | 说明 |
|------|------|------|
| `YoujinPartnerDashboard.tsx` | 中 | 推广 Tab 合并组件、学员 Tab 重排 |
| `PartnerOverviewCard.tsx` | 中 | 数据格精简为 2x2 紧凑布局、到期提示合并 |
| `PartnerAnalytics.tsx` | 小 | 颜色统一为橙色系 |
| `CommissionHistory.tsx` | 小 | 佣金金额颜色改橙 |

### 具体改动细节

#### 1. YoujinPartnerDashboard.tsx

推广 Tab 部分（第 160-183 行）：
```tsx
// 改前：3 个组件
<PartnerSelfRedeemCard />
<EntryTypeSelector />
<FixedPromoLinkCard />

// 改后：2 个组件
<PartnerSelfRedeemCard />
<PromotionHub />  // 已有合并版，包含入口切换+链接+复制+二维码
```

学员 Tab 部分（第 186-281 行）：
```tsx
// 改前：ConversionAlerts -> ConversionFunnel -> ConversionGuide -> 群管理 -> StudentList
// 改后：
<ConversionAlerts />
<StudentList />
<ConversionFunnel />
<Collapsible> {/* 工具与指南 */}
  <ConversionGuide />
  {/* 群管理内容 */}
</Collapsible>
```

删除顶部对 `EntryTypeSelector` 和 `FixedPromoLinkCard` 的 import。

#### 2. PartnerOverviewCard.tsx

将 4 格数据 grid 改为更紧凑的 2 行水平布局：

```tsx
// 改前：grid-cols-4 每格带图标+数字+标签（占 3 行高度）
// 改后：2 行各 2 个数据项，水平排列，无图标
<div className="space-y-1.5">
  <div className="flex justify-between">
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold text-orange-600">¥{total_earnings}</span>
      <span className="text-[10px] text-muted-foreground">累计收益</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold text-orange-600">¥{available_balance}</span>
      <span className="text-[10px] text-muted-foreground">可提现</span>
    </div>
  </div>
  <div className="flex justify-between">
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold text-orange-600">{total_referrals}</span>
      <span className="text-[10px] text-muted-foreground">直推用户</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-bold text-orange-600">{prepurchase_count}</span>
      <span className="text-[10px] text-muted-foreground">剩余名额</span>
    </div>
  </div>
</div>
```

到期提示从独立横幅改为在等级条 subtitle 中内联显示（移除第 118-141 行的独立到期区块，将关键信息放在等级条的副标题位置）。

#### 3. PartnerAnalytics.tsx

纯颜色替换：
- 第 289-306 行：4 格背景色全改 `bg-orange-50`，文字色全改 `text-orange-700`
- 第 282 行：`text-purple-500` 改 `text-orange-500`
- 第 317 行：`text-blue-500` 改 `text-orange-500`
- 第 247 行：`text-green-600` 改 `text-orange-600`
- 第 390 行：`bg-blue-500` 改 `bg-orange-300`
- 第 400 行：`bg-teal-500` 改 `bg-orange-400`
- 第 413 行：`bg-green-500` 改 `bg-orange-500`

#### 4. CommissionHistory.tsx

- 第 141 行：`text-green-600` 改 `text-orange-600`

### 无数据库改动

纯前端布局和样式优化，共改 4 个文件。

