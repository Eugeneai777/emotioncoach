

# 行业合作伙伴（B2B）专属飞轮系统

## 需求理解

这不是普通的分销合伙人，而是**行业级 B2B 合作伙伴**（如知乐胶囊），他们需要：
- 独立创建和管理自己的 Campaign
- 打包自己的专属产品组合
- 只看到自己带来的流量和转化数据
- 独立调整自己的转化闭环策略
- 拥有自己的漏斗分析和 AI 诊断

---

## 数据库变更

### 1. campaigns 表增加 partner_id

将 Campaign 归属到具体合作伙伴，管理员创建的（partner_id = null）为平台级活动。

### 2. 新建 partner_products 表

记录每个行业合伙人的专属产品包配置：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 记录ID |
| partner_id | uuid FK | 关联 partners.id |
| product_name | text | 产品名称（如"知乐胶囊·身心评估套餐"） |
| product_key | text | 产品标识 |
| price | numeric | 定价 |
| description | text | 产品描述 |
| is_active | boolean | 是否启用 |
| created_at | timestamptz | 创建时间 |

### 3. RLS 策略

- 管理员：可读写所有 campaigns 和 partner_products
- 行业合伙伙伴（authenticated）：只能读写 partner_id 匹配自己的 campaigns 和 partner_products
- conversion_events 和 orders：通过 campaign_id 间接实现数据隔离

---

## 前端变更

### 1. 合伙人端：新增"我的飞轮"页面

在 Partner 页面中为行业合伙伙伴新增独立的飞轮面板 `PartnerFlywheel.tsx`，包含：

- **统计卡片**：我的曝光、我的测评完成、我的成交额、我的 ROI
- **我的漏斗**：仅展示该合伙伙伴 Campaign 下的 conversion_events 数据
- **我的活动管理**：CRUD 自己的 Campaign（复用 FlywheelCampaigns 的表单逻辑）
- **我的产品包**：管理自己的专属产品组合
- **AI 诊断**：基于自己数据的一句话诊断

数据过滤逻辑：

```text
1. 获取当前用户的 partner_id
2. 查询 campaigns WHERE partner_id = 我的partner_id
3. 获取这些 campaign 的 id 列表
4. 用 campaign_id IN (我的campaign列表) 过滤 conversion_events
5. 用关联的 user_id 过滤 orders
```

### 2. 管理端：Campaign 增加合伙伙伴关联

在 FlywheelCampaigns 创建/编辑对话框中新增"所属合作伙伴"下拉选择器：
- 数据来源为 partners 表
- 可选为空（平台级活动）
- 表格中增加"合作伙伴"列

### 3. 管理端：合伙伙伴产品包管理

在管理后台新增产品包管理入口，支持为每个行业合伙伙伴配置专属产品。

### 4. 路由集成

- `/partner` 页面的 Tabs 中增加"数据飞轮"标签页（仅对有 campaign 的行业合作伙伴显示）
- 或在 YoujinPartnerDashboard 中增加飞轮入口按钮

---

## 技术细节

### 数据隔离机制

```text
合伙伙伴视角:
  campaigns (WHERE partner_id = 我) 
    └── conversion_events (WHERE campaign_id IN 我的campaigns)
        └── 漏斗统计（仅我的数据）
    └── orders (WHERE campaign_id 关联或 user_id 通过 referral 关联)
        └── 收入/ROI（仅我的数据）

管理员视角:
  campaigns (全部，含筛选)
    └── 全局漏斗 + 按合伙伙伴分组查看
```

### RLS 策略设计

```text
-- campaigns: 合伙伙伴只能操作自己的
CREATE POLICY "Partners manage own campaigns"
  ON campaigns FOR ALL TO authenticated
  USING (
    partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- partner_products: 合伙伙伴只能操作自己的产品
CREATE POLICY "Partners manage own products"
  ON partner_products FOR ALL TO authenticated
  USING (
    partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
```

### Edge Function 更新

`flywheel-ai-analysis` 增加 partner_id 参数支持，当合伙伙伴调用时只分析该合伙伙伴的数据。

---

## 新增/修改文件清单

1. **数据库迁移**：campaigns 增加 partner_id，新建 partner_products 表 + RLS
2. **新文件** `src/components/partner/PartnerFlywheel.tsx` — 合伙伙伴专属飞轮面板
3. **新文件** `src/components/partner/PartnerCampaigns.tsx` — 合伙伙伴 Campaign 管理
4. **新文件** `src/components/partner/PartnerProducts.tsx` — 合伙伙伴产品包管理
5. **修改** `src/components/admin/flywheel/FlywheelCampaigns.tsx` — 增加合作伙伴选择器
6. **修改** `src/pages/Partner.tsx` — 增加飞轮 Tab 入口
7. **修改** `supabase/functions/flywheel-ai-analysis/index.ts` — 支持 partner_id 过滤
8. **修改** campaigns 表现有 RLS 策略 — 适配合伙伙伴访问

---

## 实施顺序

1. 数据库迁移：campaigns 增加 partner_id + 新建 partner_products + 调整 RLS
2. 管理端 FlywheelCampaigns 增加合伙伙伴关联字段
3. 创建合伙伙伴专属飞轮组件（PartnerFlywheel + PartnerCampaigns + PartnerProducts）
4. Partner 页面集成飞轮 Tab
5. Edge Function 增加 partner 维度数据过滤

