
# 有劲合伙人分成产品配置方案

## 核心问题

当前「有劲合伙人」对所有有劲产品线使用统一佣金率，无法：
- 明确指定哪些产品可参与分成
- 为不同产品设置不同佣金率
- 排除某些产品（如测评报告）不参与分成

---

## 解决方案：产品级佣金配置

新增「合伙人产品佣金配置表」，实现按产品精细化分成控制。

---

## 数据库变更

### 新建 partner_product_commissions 表

```sql
CREATE TABLE partner_product_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_level_rule_id UUID REFERENCES partner_level_rules(id) ON DELETE CASCADE,
  package_key TEXT NOT NULL,
  commission_rate_l1 DECIMAL(5,4) NOT NULL DEFAULT 0.20,
  commission_rate_l2 DECIMAL(5,4) NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_level_rule_id, package_key)
);
```

### 数据结构示例

| partner_level_rule_id | package_key | commission_rate_l1 | commission_rate_l2 | is_enabled |
|:----------------------|:------------|:-------------------|:-------------------|:-----------|
| L1的UUID | basic | 0.20 | 0 | true |
| L1的UUID | member365 | 0.20 | 0 | true |
| L1的UUID | scl90_report | 0 | 0 | false |
| L2的UUID | basic | 0.35 | 0 | true |
| L3的UUID | basic | 0.50 | 0.10 | true |

---

## 业务逻辑变更

### calculate-commission 边缘函数

```
原逻辑：
  order_type → getProductLine() → 匹配合伙人类型 → 使用统一佣金率

新逻辑：
  order_type (package_key) 
    → 查询 partner_product_commissions 表
    → 获取该产品的专属佣金率
    → 如果 is_enabled = false，跳过分成
    → 如果未配置，使用 partner_level_rules 的默认佣金率
```

### 兼容性策略

- **默认回退**：如果产品未在 `partner_product_commissions` 中配置，使用 `partner_level_rules` 的默认佣金率
- **老数据兼容**：不需要立即为所有产品配置，系统自动回退

---

## 管理后台变更

### 增强 PartnerLevelManagement.tsx

在编辑对话框中新增「产品佣金配置」Tab：

```
┌──────────────────────────────────────────────────────┐
│  编辑 L1 等级配置                                      │
├──────────────────────────────────────────────────────┤
│  [基础信息] [权益配置] [产品佣金]                        │
├──────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐ │
│  │ 默认佣金率: 一级 20% / 二级 0%                    │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  产品专属配置：                                        │
│  ┌──────────────────────────────────────────────────┐│
│  │ [✓] 尝鲜会员 (basic)      一级 20%  二级 0%       ││
│  │ [✓] 365会员 (member365)   一级 20%  二级 0%       ││
│  │ [✓] 财富训练营 (wealth)   一级 25%  二级 5%       ││
│  │ [ ] SCL-90报告 (scl90)    — 不参与分成 —          ││
│  └──────────────────────────────────────────────────┘│
│                                                      │
│  + 添加产品配置                                        │
└──────────────────────────────────────────────────────┘
```

---

## 计算示例

**场景**：L3 钻石合伙人推荐用户购买

| 产品 | 价格 | 配置佣金率 | 一级佣金 | 二级佣金 |
|:-----|:-----|:----------|:--------|:--------|
| 尝鲜会员 | ¥9.9 | 50%/10% | ¥4.95 | ¥0.99 |
| 365会员 | ¥365 | 50%/10% | ¥182.50 | ¥36.50 |
| 财富训练营 | ¥1999 | 40%/8% (特殊) | ¥799.60 | ¥159.92 |
| SCL-90报告 | ¥29.9 | 不参与 | ¥0 | ¥0 |

---

## 修改文件清单

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| 数据库迁移 | 新增 | 创建 partner_product_commissions 表 |
| `calculate-commission/index.ts` | 修改 | 查询产品专属佣金配置 |
| `PartnerLevelManagement.tsx` | 修改 | 添加产品佣金配置 Tab |
| `usePartnerLevels.ts` | 修改 | 扩展返回产品佣金数据 |

---

## 技术细节

### 修改后的佣金计算逻辑

```typescript
// calculate-commission/index.ts
async function getCommissionRates(
  supabase: any,
  partnerLevelRuleId: string,
  packageKey: string
) {
  // 1. 先查产品专属配置
  const { data: productConfig } = await supabase
    .from('partner_product_commissions')
    .select('*')
    .eq('partner_level_rule_id', partnerLevelRuleId)
    .eq('package_key', packageKey)
    .single();

  if (productConfig) {
    if (!productConfig.is_enabled) {
      return null; // 产品不参与分成
    }
    return {
      l1: productConfig.commission_rate_l1,
      l2: productConfig.commission_rate_l2
    };
  }

  // 2. 回退到等级默认佣金率
  const { data: levelRule } = await supabase
    .from('partner_level_rules')
    .select('commission_rate_l1, commission_rate_l2')
    .eq('id', partnerLevelRuleId)
    .single();

  return levelRule ? {
    l1: levelRule.commission_rate_l1,
    l2: levelRule.commission_rate_l2
  } : null;
}
```

---

## 初始化数据

为保持兼容，可选择性初始化当前有劲产品的默认配置：

```sql
-- 为每个有劲等级插入默认产品配置
INSERT INTO partner_product_commissions (partner_level_rule_id, package_key, commission_rate_l1, commission_rate_l2, is_enabled)
SELECT 
  plr.id,
  p.package_key,
  plr.commission_rate_l1,
  plr.commission_rate_l2,
  true
FROM partner_level_rules plr
CROSS JOIN packages p
WHERE plr.partner_type = 'youjin' 
  AND p.product_line = 'youjin'
  AND p.is_active = true;
```

---

## 优势

1. **灵活配置**：可按产品、按等级设置不同佣金率
2. **排除产品**：可禁用某些产品不参与分成
3. **向后兼容**：未配置的产品使用默认佣金率
4. **可视化管理**：在后台直观配置每个产品的分成规则
