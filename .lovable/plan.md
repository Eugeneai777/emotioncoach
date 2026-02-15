

## 合伙人中心重构 — 以飞轮为核心的统一布局

### 设计理念

当前合伙人中心按"有劲"和"绽放"分开展示，信息割裂。用户真正关心的是：**我推广的人走到了哪一步，每一步转化了多少，赚了多少钱**。

将页面重构为以"有劲飞轮 4 层漏斗"为主线的统一视图：

```text
+------------------------------------------+
|  合伙人中心                               |
+------------------------------------------+
|  身份卡片（保留现有，不变）                  |
|  - Bloom: BloomOverviewCard               |
|  - Youjin: PartnerOverviewCard            |
+------------------------------------------+
|                                          |
|  🎯 我的飞轮                              |
|                                          |
|  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐ |
|  │  1   │→ │  2   │→ │  3   │→ │  4   │ |
|  │测评  │  │有劲  │  │绽放  │  │合伙人│ |
|  │工具  │  │训练营│  │训练营│  │      │ |
|  │ 23人 │  │ 5人  │  │ 2人  │  │ 1人  │ |
|  │¥227  │  │¥1495 │  │¥xxx  │  │¥4950 │ |
|  └──────┘  └──────┘  └──────┘  └──────┘ |
|     21.7%→    40%→      50%→             |
|                                          |
|  总收益 ¥8,672  可提现 ¥3,200             |
|                                          |
+------------------------------------------+
|  推广 | 学员 | 收益                        |
+------------------------------------------+
```

### 核心改动

#### 1. 新建组件 `MyFlywheelOverview`

一个紧凑的 4 格水平漏斗卡片，每格显示：
- 层级编号 + 名称（1 测评/工具、2 有劲训练营、3 绽放训练营、4 合伙人）
- 该层级的转化人数
- 该层级产生的收益
- 相邻层级之间的转化率箭头

数据来源复用现有的 `partner_referrals` 表（通过 `conversion_status` 和 `has_joined_group` 字段判断用户处于哪个层级）以及 `orders` 表（计算各层级收益）。

#### 2. 统一 Partner.tsx 布局（两种身份共用）

无论 Bloom 还是 Youjin 合伙人，页面结构统一为：

1. **身份卡片**：保留现有的 `BloomOverviewCard` 或 `PartnerOverviewCard`，展示身份、佣金比例、余额等
2. **飞轮概览**：新增 `MyFlywheelOverview`，紧凑展示 4 层转化数据
3. **功能 Tabs**：统一为 3 个 Tab
   - 推广（分享物料、推广链接、入口设置）
   - 学员（学员列表、转化漏斗详情、跟进提醒）
   - 收益（佣金明细、数据分析、提现）

#### 3. 移除冗余区域

- 移除 Bloom 视图中单独的"推广码"卡片和"附赠权益"分隔线
- 移除 Bloom 视图中原有的"飞轮"Tab（已提升为页面级组件）
- 将 `BloomYoujinBenefitsCard` 的核心功能（入口类型设置、推广链接）整合到"推广"Tab 中

### 技术细节

**新建文件：**
- `src/components/partner/MyFlywheelOverview.tsx` — 飞轮 4 层概览组件

**修改文件：**
- `src/pages/Partner.tsx` — 重构 Partner View 区域布局

**Partner.tsx 新布局伪代码：**

```tsx
{isPartner && partner && (
  <>
    {/* 1. 身份卡片 — 保留原有组件 */}
    {partner.partner_type === 'bloom' 
      ? <BloomOverviewCard partner={partner} />
      : <PartnerOverviewCard partner={partner} ... />
    }

    {/* 2. 飞轮概览 — 新组件，两种身份通用 */}
    <MyFlywheelOverview partnerId={partner.id} />

    {/* 3. 统一 Tabs */}
    <Tabs defaultValue="promote">
      <TabsList>
        推广 | 学员 | 收益
      </TabsList>
      {/* 推广 Tab: 合并推广链接、入口设置、分享物料 */}
      {/* 学员 Tab: 学员列表、转化详情 */}
      {/* 收益 Tab: 佣金、分析、提现 */}
    </Tabs>
  </>
)}
```

**MyFlywheelOverview 数据逻辑：**
- 查询 `partner_referrals` 获取各 `conversion_status` 的人数分布
- 查询 `orders` 按产品类型分组计算各层收益
- 4 格水平布局，移动端 2x2 网格，桌面端 1x4 横排
- 层级之间显示转化率百分比

**Bloom 推广 Tab 内容整合：**
- 从 `BloomYoujinBenefitsCard` 提取 `EntryTypeSelector` 放入推广 Tab
- 推广码复制功能整合到推广 Tab
- 推广链接（`FixedPromoLinkCard`）整合到推广 Tab（Bloom 用推广码链接，Youjin 用固定推广链接）

这样不论哪种合伙人身份，用户都能在同一个页面中一目了然地看到"飞轮 4 层"的转化数据和收益情况。

