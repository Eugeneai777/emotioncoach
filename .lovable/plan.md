

## 将"生命绽放特训营"和"绽放教练认证"做成独立产品

### 问题分析

用户需要将两个高价产品从"权益展示"升级为"可购买产品"：

| 产品名称 | 价格 | 描述 | 当前状态 |
|:---------|:-----|:-----|:---------|
| 生命绽放特训营 | ¥12,800 | 4周线上特训营，重塑生命能量 | 仅作为权益展示在 partner_benefits |
| 绽放教练认证 | ¥16,800 | 国际认证绽放教练资质 | 仅作为权益展示在 partner_benefits |

**需求：**
1. 作为独立产品添加到 `packages` 表
2. 归属"绽放系列"（product_line = 'bloom'）
3. 享受绽放合伙人分成（30% 一级 + 10% 二级）

---

### 实施方案

#### 第一步：数据库 - 添加产品到 packages 表

```sql
INSERT INTO packages (package_key, package_name, product_line, price, description, is_active, display_order)
VALUES 
  ('bloom_life_camp', '生命绽放特训营', 'bloom', 12800.00, '4周线上特训营，重塑生命能量', true, 32),
  ('bloom_coach_cert', '绽放教练认证', 'bloom', 16800.00, '国际认证绽放教练资质', true, 35);
```

添加后的绽放产品列表：

| display_order | package_key | package_name | 价格 |
|:--------------|:------------|:-------------|:-----|
| 30 | bloom_identity_camp | 身份绽放训练营 | ¥2,980 |
| 31 | bloom_emotion_camp | 情感绽放训练营 | ¥3,980 |
| 32 | bloom_life_camp | 生命绽放特训营 | ¥12,800 |
| 35 | bloom_coach_cert | 绽放教练认证 | ¥16,800 |
| 40 | bloom_partner | 绽放合伙人 | ¥19,800 |

#### 第二步：前端 - 更新产品分类配置

更新 `productCategories.ts`，新增"绽放进阶"分类以展示高阶产品：

```typescript
// 方案A：新增独立分类
{
  id: 'bloom-advanced',
  name: '绽放进阶',
  emoji: '🌟',
  gradient: 'from-purple-600 to-pink-600',
  description: '深度转化，专业认证',
  tagline: '进阶成长之路',
  buttonGradient: 'from-purple-600/20 to-pink-600/20'
}

// 方案B：整合到现有"绽放训练营"分类
// 无需新增分类，在 bloom-camp 中展示所有训练营
```

#### 第三步：前端 - 更新产品展示组件

**文件**: `src/components/ProductComparisonTable.tsx`

在"绽放训练营"分类中添加两个新产品卡片：

```tsx
// bloom-camp 分类中添加
const bloomAdvancedProducts = [
  {
    key: 'bloom_life_camp',
    name: '生命绽放特训营',
    price: 12800,
    icon: '🔥',
    description: '4周线上特训营，重塑生命能量',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    features: ['4周深度转化', '真人教练陪伴', '重塑生命能量']
  },
  {
    key: 'bloom_coach_cert',
    name: '绽放教练认证',
    price: 16800,
    icon: '📜',
    description: '国际认证绽放教练资质',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    features: ['国际认证资质', '专业教练培训', '终身学习支持']
  }
];
```

#### 第四步：佣金配置

绽放合伙人（L0）的默认佣金率已配置：
- 一级佣金：30%
- 二级佣金：10%

新产品将自动继承这些默认佣金率。无需额外配置 `partner_product_commissions` 表（除非需要自定义费率）。

---

### 涉及的文件/表

| 操作 | 文件/表 | 修改内容 |
|:-----|:--------|:---------|
| INSERT | 数据库 `packages` | 添加 bloom_life_camp、bloom_coach_cert |
| 修改 | `src/config/productCategories.ts` | 新增 bloom-advanced 分类（可选） |
| 修改 | `src/components/ProductComparisonTable.tsx` | 添加两个高阶产品的展示和购买逻辑 |

---

### 预期效果

1. **产品中心展示**：
   - 绽放训练营标签页展示 4 个产品（2个基础 + 2个进阶）
   - 或新增"绽放进阶"标签页单独展示高阶产品

2. **购买流程**：
   - 用户可直接微信支付购买这两个产品
   - 支付成功后记录订单

3. **合伙人分成**：
   - 绽放合伙人推广这两个产品可获得 30% 一级佣金
   - 二级推广可获得 10% 间接佣金

4. **收益计算示例**：

| 产品 | 价格 | 一级佣金(30%) | 二级佣金(10%) |
|:-----|:-----|:--------------|:--------------|
| 生命绽放特训营 | ¥12,800 | ¥3,840 | ¥1,280 |
| 绽放教练认证 | ¥16,800 | ¥5,040 | ¥1,680 |

