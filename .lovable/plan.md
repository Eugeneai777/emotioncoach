
# 将有劲合伙人产品加入分成系统

## 现状分析

当前有劲合伙人产品（`youjin_partner_l1`、`youjin_partner_l2`、`youjin_partner_l3`）：

| 产品 | 状态 | 问题 |
|:-----|:-----|:-----|
| 在 packages 表中 | 已存在 | product_line = 'youjin' |
| 在 partner_product_commissions 表中 | 已存在 | 迁移脚本已自动初始化 |
| 在 calculate-commission 函数中 | 未明确识别 | 依赖 fallback 逻辑 |

---

## 解决方案

只需修改 `calculate-commission` 边缘函数的 `getProductLine()` 函数，将有劲合伙人产品明确加入有劲产品列表。

---

## 修改内容

### 文件：supabase/functions/calculate-commission/index.ts

**修改前（第 5-14 行）**：
```typescript
function getProductLine(orderType: string): 'youjin' | 'bloom' {
  // 有劲产品线：基础会员、365会员、尝鲜会员
  const youjinProducts = ['basic', 'member365', 'trial', 'package_trial', 'package_365', 'ai_coach_upgrade'];
  // 绽放产品线：合伙人套餐
  const bloomProducts = ['partner', 'partner_package'];
  
  if (youjinProducts.includes(orderType)) return 'youjin';
  if (bloomProducts.includes(orderType)) return 'bloom';
  return 'youjin';
}
```

**修改后**：
```typescript
function getProductLine(orderType: string): 'youjin' | 'bloom' {
  // 有劲产品线：会员、测评、训练营、有劲合伙人
  const youjinProducts = [
    'basic', 'member365', 'trial', 'package_trial', 'package_365',
    'ai_coach_upgrade',
    'wealth_block_assessment', 'scl90_report', 'emotion_health_assessment',
    'camp-emotion_journal_21', 'wealth_camp_7day',
    'youjin_partner_l1', 'youjin_partner_l2', 'youjin_partner_l3'
  ];
  // 绽放产品线：绽放合伙人
  const bloomProducts = ['partner', 'partner_package', 'bloom_partner'];
  
  if (youjinProducts.includes(orderType)) return 'youjin';
  if (bloomProducts.includes(orderType)) return 'bloom';
  return 'youjin';
}
```

---

## 关键变更说明

1. **新增有劲合伙人产品**：`youjin_partner_l1`、`youjin_partner_l2`、`youjin_partner_l3`
2. **补充其他有劲产品**：测评类（`wealth_block_assessment`、`scl90_report`、`emotion_health_assessment`）和训练营类（`camp-emotion_journal_21`、`wealth_camp_7day`）
3. **补充绽放产品**：`bloom_partner`

---

## 佣金配置效果

修改后，管理后台（/admin/partner-levels）的「产品佣金配置」Tab 将显示这些产品：

| 产品 | 价格 | 默认佣金（L1） | 可单独配置 |
|:-----|:-----|:--------------|:----------|
| 初级合伙人 (youjin_partner_l1) | ¥792 | 20% | 是 |
| 高级合伙人 (youjin_partner_l2) | ¥3,217 | 20% | 是 |
| 钻石合伙人 (youjin_partner_l3) | ¥4,950 | 20% | 是 |

你可以在后台为这些产品设置不同的佣金率，或禁用某个等级的分成。

---

## 修改范围

| 文件 | 操作 |
|:-----|:-----|
| supabase/functions/calculate-commission/index.ts | 修改 getProductLine() 函数 |

**无需数据库变更**：产品佣金配置已在之前的迁移中自动初始化。
