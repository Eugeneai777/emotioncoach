

## 有劲合伙人佣金同步修复计划

### 问题总结

经检查发现，前端配置文件 (`partnerLevels.ts`, `productComparison.ts`) 已更新为新佣金结构，但以下位置仍使用旧数据：

| 位置 | 旧数据 | 正确数据 |
|:-----|:-------|:---------|
| 介绍页面文字 | L1=20%, L2=35% | L1=18%, L2=30%+5% |
| 收益计算示例 | 20%/35% 计算 | 18%/30% 计算 |
| 数据库配置 | L2无二级, L3二级10% | L2二级5%, L3二级12% |

---

### 修复内容

#### 1. 修复 `src/pages/YoujinPartnerIntro.tsx`

**第160行** - 核心价值描述：

```typescript
// 旧
L1享20%，L2享35%，L3享50%+二级10%

// 新
L1享18%，L2享30%+二级5%，L3享50%+二级12%
```

---

#### 2. 修复 `src/pages/YoujinPartnerPlan.tsx`

**等级权益卡片（约570-660行）**：

| 等级 | 旧显示 | 新显示 |
|:-----|:-------|:-------|
| L1 | 20%全产品佣金 | 18%全产品佣金 |
| L2 | 35%全产品佣金 | 30%全产品佣金 + 5%二级佣金 |
| L3 | 10%二级佣金 | 12%二级佣金 |

**收益计算表格（约765-850行）**：

```text
// L1 旧计算
30 ×（365 × 20%）= ¥2,190

// L1 新计算
30 ×（365 × 18%）= ¥1,971
```

```text
// L2 旧计算（无二级）
150 ×（365 × 35%）= ¥19,162.5

// L2 新计算（含二级）
150 ×（365 × 30%）= ¥16,425
+ 二级收益...
```

---

#### 3. 修复 `src/pages/Partner.tsx`

**第112行**：

```typescript
// 旧
全产品20%-50%佣金

// 新
全产品18%-50%佣金
```

**第168行 对比表格**：

```typescript
// 旧
{ label: "佣金比例", values: ["20%-50%", "30%+10%"] }

// 新
{ label: "佣金比例", values: ["18%-50%", "30%+10%"] }
```

---

#### 4. 修复 `src/pages/PlatformIntro.tsx`

**第147行**：

```typescript
// 旧
features: ['预购体验包', '分发建立关系', '持续佣金20%-50%']

// 新
features: ['预购体验包', '分发建立关系', '持续佣金18%-50%']
```

---

#### 5. 同步数据库 `partner_level_rules` 表

执行以下SQL更新：

```sql
UPDATE partner_level_rules 
SET 
  commission_rate_l1 = 0.18, 
  commission_rate_l2 = 0.00,
  benefits = ARRAY['全产品18%佣金', '专属推广二维码', '100份体验包分发权', '合伙人专属社群']
WHERE level_name = 'L1' AND partner_type = 'youjin';

UPDATE partner_level_rules 
SET 
  commission_rate_l1 = 0.30, 
  commission_rate_l2 = 0.05,
  benefits = ARRAY['全产品30%佣金', '二级5%佣金', '专属推广二维码', '500份体验包分发权', '优先活动参与权', '专属运营支持']
WHERE level_name = 'L2' AND partner_type = 'youjin';

UPDATE partner_level_rules 
SET 
  commission_rate_l1 = 0.50, 
  commission_rate_l2 = 0.12,
  benefits = ARRAY['全产品50%佣金', '二级12%佣金', '1000份体验包分发权', 'VIP活动邀请', '专属客户经理', '定制化营销物料']
WHERE level_name = 'L3' AND partner_type = 'youjin';
```

---

### 涉及文件

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| `src/pages/YoujinPartnerIntro.tsx` | 修改 | 更新文字描述 |
| `src/pages/YoujinPartnerPlan.tsx` | 修改 | 更新权益卡片和收益计算 |
| `src/pages/Partner.tsx` | 修改 | 更新概览描述和对比表 |
| `src/pages/PlatformIntro.tsx` | 修改 | 更新合伙人简介 |
| 数据库 `partner_level_rules` | 更新 | 同步佣金配置 |

---

### 修复后验证清单

1. `/partner/youjin-intro` - 核心价值部分应显示新佣金
2. `/partner/youjin-plan` - 等级卡片和收益计算应使用新比例
3. `/partner` - 非合伙人视图的概览应显示18%-50%
4. `/platform-intro` - 合伙人板块应显示18%-50%
5. 后台管理应读取到新的佣金配置

