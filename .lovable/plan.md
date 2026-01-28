
## 绽放合伙人权益介绍完善方案

### 问题分析

当前绽放合伙人的权益介绍页面（`PartnerIntro.tsx`、`PartnerBenefits.tsx`）和服务条款（`BloomPartnerTerms.tsx`）均未包含有劲初级合伙人权益的说明。需要在以下位置补充：

| 位置 | 需更新内容 |
|:-----|:----------|
| 绽放合伙人介绍页 | 新增"有劲产品推广权益"说明区块 |
| 绽放合伙人权益列表 | 数据库新增有劲推广权益记录 |
| 绽放合伙人条款 | 第三节补充有劲产品佣金条款 |
| 合伙人对比卡片 | 绽放卡片补充有劲产品分成说明 |

---

### 实施方案

#### 1. 数据库：新增有劲推广权益

向 `partner_benefits` 表插入新记录：

```sql
INSERT INTO partner_benefits (benefit_name, benefit_description, benefit_value, benefit_icon, display_order, is_active)
VALUES (
  '有劲产品推广权益',
  '自动获得有劲初级合伙人身份，有劲全产品18%一级佣金',
  0.00,
  '💪',
  10,
  true
);
```

#### 2. 绽放合伙人介绍页 (`PartnerIntro.tsx`)

在"收益机制"区块后新增"有劲产品权益"说明：

```tsx
{/* 有劲产品权益 */}
<Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
  <CardHeader className="pb-2 pt-4 px-4">
    <CardTitle className="flex items-center gap-2 text-base">
      <Sparkles className="w-5 h-5 text-orange-500" />
      额外权益：有劲产品推广
    </CardTitle>
    <Badge className="w-fit bg-orange-100 text-orange-700 border-orange-200">
      💪 自动获得初级合伙人身份
    </Badge>
  </CardHeader>
  <CardContent className="px-4 pb-4 space-y-3">
    <p className="text-sm text-muted-foreground">
      成为绽放合伙人后，您将自动拥有有劲初级合伙人身份，可以推广有劲全系列产品：
    </p>
    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 bg-white/80 rounded-lg border border-orange-100">
        <div className="text-lg font-bold text-orange-600">18%</div>
        <div className="text-xs text-muted-foreground">有劲产品一级佣金</div>
      </div>
      <div className="p-3 bg-white/80 rounded-lg border border-orange-100">
        <div className="text-lg font-bold text-orange-600">11款</div>
        <div className="text-xs text-muted-foreground">可推广产品</div>
      </div>
    </div>
    <Button 
      variant="outline" 
      className="w-full gap-2 border-orange-200 text-orange-700"
      onClick={() => navigate("/partner/youjin-plan")}
    >
      了解有劲产品详情
    </Button>
  </CardContent>
</Card>
```

#### 3. 合伙人对比卡片 (`Partner.tsx`)

更新非合伙人视图中的绽放合伙人卡片说明：

```tsx
{/* 绽放合伙人卡片 - 新增有劲权益说明 */}
<div className="flex items-center gap-2">
  <TrendingUp className="w-4 h-4 text-purple-500" />
  <span className="text-sm">直推30% + 二级10%</span>
</div>
<div className="flex items-center gap-2">
  <Sparkles className="w-4 h-4 text-orange-500" />
  <span className="text-sm">含有劲初级合伙人权益</span>
</div>
```

同时更新对比表格：

| 对比项 | 💪 有劲合伙人 | 🦋 绽放合伙人 |
|:-------|:-------------|:-------------|
| 可分成产品 | 所有有劲产品 | 绽放产品 + **有劲产品** |

#### 4. 绽放合伙人条款 (`BloomPartnerTerms.tsx`)

在第三节"绽放合伙人专属权益"后新增有劲产品权益条款：

```tsx
<p>3.5 <strong>有劲产品推广权益</strong></p>
<p>成为绽放合伙人后，您将自动获得有劲初级合伙人身份，享有以下额外权益：</p>
<ul className="list-disc pl-6 space-y-1">
  <li>有劲全系列产品（11款）推广资格</li>
  <li>有劲产品一级佣金：<strong>18%</strong></li>
  <li>有劲体验包分发权限</li>
</ul>
<p>注：有劲产品佣金独立于绽放产品佣金计算，两者可同时获得。</p>
```

---

### 涉及文件清单

| 操作 | 文件 | 修改内容 |
|:-----|:-----|:---------|
| 新增 | 数据库 `partner_benefits` | 插入有劲推广权益记录 |
| 修改 | `src/pages/PartnerIntro.tsx` | 新增有劲产品权益区块 |
| 修改 | `src/pages/Partner.tsx` | 更新对比卡片和对比表格 |
| 修改 | `src/pages/BloomPartnerTerms.tsx` | 新增第3.5条有劲权益条款 |

---

### 预期效果

1. **介绍页**：用户在考虑购买绽放合伙人时，能清楚看到还包含有劲产品推广权益
2. **权益页**：权益列表中展示有劲推广权益
3. **对比表**：非合伙人用户能对比看到绽放合伙人同时覆盖两条产品线
4. **条款页**：正式法律条款中明确有劲产品佣金规则
