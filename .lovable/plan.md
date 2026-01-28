

# 将青少年训练营加入学员转化闭环

## 变更概述

在 `packages` 表创建青少年训练营记录，并将其加入学员转化闭环的"已购买"产品列表。

## 数据库变更

### 新增 packages 表记录

| 字段 | 值 |
|:-----|:---|
| package_key | `camp-parent_emotion_21` |
| package_name | 21天青少年困境突破营 |
| price | 299.00 |
| ai_quota | 0 |
| duration_days | 21 |
| description | 21天陪伴青少年突破成长困境 |
| is_active | true |
| display_order | 11 |

### SQL 迁移

```sql
INSERT INTO public.packages (
  package_key,
  package_name,
  price,
  ai_quota,
  duration_days,
  description,
  is_active,
  display_order
) VALUES (
  'camp-parent_emotion_21',
  '21天青少年困境突破营',
  299.00,
  0,
  21,
  '21天陪伴青少年突破成长困境',
  true,
  11
);
```

## 代码变更

### 更新简化后的转化闭环产品列表

在之前讨论的 `SimplifiedConversionCard.tsx` 和 `StudentList.tsx` 中，"已购买"产品列表需包含：

```typescript
const youjinProducts = [
  // 基础产品
  'basic',                        // ¥9.9 尝鲜会员
  'emotion_health_assessment',    // ¥9.9 情绪健康测评
  'wealth_block_assessment',      // ¥9.9 财富卡点测评
  'scl90_report',                 // ¥9.9 SCL-90测评
  
  // 训练营
  'camp-emotion_journal_21',      // ¥299 情绪日记训练营
  'camp-parent_emotion_21',       // ¥299 青少年困境突破营 ← 新增
  'wealth_camp_7day',             // ¥299 财富觉醒训练营
  
  // 会员
  'member365',                    // ¥365 年度会员
  
  // 合伙人（用于区分合伙人状态）
  'youjin_partner_l1',            // ¥792 初级合伙人
  'youjin_partner_l2',            // ¥3217 高级合伙人
  'youjin_partner_l3',            // ¥4950 钻石合伙人
];
```

## 文件修改清单

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| 数据库迁移 | 新建 | 插入 packages 表记录 |
| `src/components/partner/SimplifiedConversionCard.tsx` | 新建 | 包含完整产品列表（含青少年训练营） |
| `src/components/partner/StudentList.tsx` | 重构 | 使用新的产品列表判断购买状态 |

## 注意事项

1. **package_key 命名规范**：遵循现有训练营命名格式 `camp-{camp_type}`
2. **display_order**：设为 11，紧跟在情绪日记训练营 (10) 之后
3. **佣金配置**：新产品可能需要在 `partner_product_commissions` 表配置佣金比例

