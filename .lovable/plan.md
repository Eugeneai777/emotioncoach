

# 职场压力套餐推广页：情绪训练营 + 知乐胶囊 ¥399

## 概述

创建一个独立的推广页 `/promo/workplace-stress`，面向职场压力大人群，主打"买训练营送知乐胶囊"的超值组合，售价 ¥399。

## 页面结构

```text
┌──────────────────────────────┐
│  🔥 限时特惠 · 职场压力急救包   │  ← Hero区：痛点共鸣标题
│  "压力大到失眠？焦虑到心悸？"   │
├──────────────────────────────┤
│  套餐内容展示                   │
│  ┌─────────┐  ┌─────────┐    │
│  │训练营    │  │知乐胶囊  │    │  ← 两个产品卡片
│  │¥399     │  │¥399     │    │
│  │21天系统  │  │立刻见效  │    │
│  └─────────┘  └─────────┘    │
│                              │
│  原价 ¥798 → 限时 ¥399       │  ← 价格对比区
│  买训练营，送知乐胶囊一瓶！     │
├──────────────────────────────┤
│  ✓ 7天内改善睡眠质量           │
│  ✓ 科学情绪管理方法            │  ← 效果承诺
│  ✓ AI教练全程陪伴             │
│  ✓ 知乐胶囊快速缓解身体症状    │
├──────────────────────────────┤
│  用户评价 / 社会证明            │
├──────────────────────────────┤
│  [立即抢购 ¥399] 按钮          │  ← 底部固定CTA
│  已有 X 人购买                 │
└──────────────────────────────┘
```

## 技术方案

### 1. 数据库：新增 `promo_pages` 表

存储推广页配置，支持后续创建更多推广页：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| slug | text UNIQUE | URL标识，如 `workplace-stress` |
| title | text | 页面标题 |
| subtitle | text | 副标题/痛点描述 |
| target_audience | text | 目标人群 |
| bundle_price | numeric | 套餐价 399 |
| original_price | numeric | 原价 798 |
| products | jsonb | 包含的产品列表（训练营+胶囊） |
| selling_points | jsonb | 卖点列表 |
| testimonials | jsonb | 用户评价 |
| theme | jsonb | 视觉主题配置 |
| is_active | boolean | 是否上线 |
| created_at | timestamptz | |

RLS：公开可读（推广页面向所有人），仅管理员可写。

### 2. 新页面：`src/pages/PromoPage.tsx`

- 路由：`/promo/:slug`
- 从 `promo_pages` 按 slug 加载配置
- 移动端优先的沉浸式设计
- 产品双卡展示 + 价格划线对比
- 底部固定购买按钮
- 点击购买 → 弹出 `UnifiedPayDialog`（复用现有支付流程）
- 支持 `?ref=xxx` 合伙人推广追踪

### 3. 新组件：`src/components/promo/PromoProductCard.tsx`

产品卡片组件，展示训练营和胶囊各自的价值。

### 4. 首个推广页数据（通过 migration 插入）

预置"职场压力急救包"数据：
- slug: `workplace-stress`
- bundle_price: 399
- original_price: 798
- products: 情绪管理训练营（21天AI教练陪伴） + 知乐胶囊（1瓶）
- selling_points: 7天改善睡眠、科学情绪管理、AI全程陪伴、胶囊快速缓解

### 5. 支付对接

复用 `UnifiedPayDialog`，创建订单时 `product_type` 设为 `promo_bundle`，`metadata` 记录 promo slug 和包含的产品 ID，支付成功后需要同时：
- 激活训练营权限
- 记录胶囊发货信息（写入 orders 表备注）

## 实现顺序

1. 创建 `promo_pages` 表 + 插入首条数据
2. 实现 `PromoPage.tsx` 页面 + 路由注册
3. 对接支付流程
4. 添加管理后台入口（可选，后续迭代）

