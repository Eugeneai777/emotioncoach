

## 合伙人升级功能（全价升级模式）

### 商业策略

| 场景 | 支付金额 | 说明 |
|:-----|:---------|:-----|
| 新用户直接购买L3 | ¥4,950 | 一步到位，最划算 |
| L1用户升级到L3 | ¥4,950 | 全价购买，累计花费¥5,742 |
| L2用户升级到L3 | ¥4,950 | 全价购买，累计花费¥8,167 |

**核心心理**：早买钻石 = 省钱；犹豫后升级 = 多花钱

### 实施内容

#### 1. 后端：支付回调处理有劲合伙人

**文件**: `supabase/functions/wechat-pay-callback/index.ts`

```typescript
// 处理有劲合伙人套餐购买/升级
if (order.package_key.startsWith('youjin_partner_')) {
  const levelName = order.package_key.replace('youjin_partner_', '').toUpperCase();
  
  // 获取等级规则
  const { data: levelRule } = await supabase
    .from('partner_level_rules')
    .select('*')
    .eq('partner_type', 'youjin')
    .eq('level_name', levelName)
    .single();
  
  if (levelRule) {
    // 查询是否已是合伙人
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', order.user_id)
      .maybeSingle();
    
    if (existingPartner && existingPartner.partner_type === 'youjin') {
      // 升级：直接覆盖为新等级（全价购买）
      await supabase
        .from('partners')
        .update({
          partner_level: levelName,
          prepurchase_count: levelRule.min_prepurchase,  // 直接设为新等级配额
          commission_rate_l1: levelRule.commission_rate_l1,
          commission_rate_l2: levelRule.commission_rate_l2,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPartner.id);
    } else {
      // 新建合伙人记录
      await supabase
        .from('partners')
        .insert({
          user_id: order.user_id,
          partner_type: 'youjin',
          partner_level: levelName,
          partner_code: generatePartnerCode(),
          prepurchase_count: levelRule.min_prepurchase,
          prepurchase_expires_at: calculateExpiry(),
          commission_rate_l1: levelRule.commission_rate_l1,
          commission_rate_l2: levelRule.commission_rate_l2,
          status: 'active',
          source: 'purchase',
        });
    }
  }
}
```

#### 2. 后端：订单创建保持全价

**文件**: `supabase/functions/create-wechat-order/index.ts`

- 不做差价计算
- 保持从 `packages` 表或 `partner_level_rules` 表读取的原价
- 可增加判断：如果目标等级 ≤ 当前等级，返回错误提示

```typescript
// 禁止降级购买
if (packageKey.startsWith('youjin_partner_') && existingPartner) {
  const levelOrder = { 'L1': 1, 'L2': 2, 'L3': 3 };
  const targetLevel = packageKey.replace('youjin_partner_', '').toUpperCase();
  
  if (levelOrder[targetLevel] <= levelOrder[existingPartner.partner_level]) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '您已是同等级或更高等级合伙人' 
      }),
      { status: 400 }
    );
  }
}
```

#### 3. 前端：升级提示（显示全价 + 省钱心理暗示）

**文件**: `src/pages/YoujinPartnerIntro.tsx`

```tsx
// 已是合伙人的情况
{partner?.partner_type === 'youjin' && (
  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
    <p className="text-amber-800">
      您当前是 <strong>{partner.partner_level} 合伙人</strong>
    </p>
    {partner.partner_level !== 'L3' && (
      <p className="text-sm text-amber-600 mt-1">
        升级到更高等级需支付全价，建议尽早一步到位！
      </p>
    )}
  </div>
)}

// 购买按钮
{level.level === partner?.partner_level ? (
  <Button disabled>当前等级</Button>
) : levelOrder[level.level] < levelOrder[partner?.partner_level] ? (
  <Button disabled>不可降级</Button>
) : (
  <Button onClick={() => handlePurchase(level)}>
    {partner ? '升级购买' : '立即购买'} ¥{level.price}
  </Button>
)}
```

#### 4. 合伙人中心升级入口

**文件**: `src/components/partner/YoujinPartnerDashboard.tsx`

```tsx
// L1/L2 合伙人显示升级提示
{partner.partner_level !== 'L3' && (
  <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        升级到钻石合伙人
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-600 mb-4">
        享受50%一级佣金 + 12%二级佣金，收益翻倍！
      </p>
      <p className="text-xs text-amber-600 mb-4">
        💡 升级需支付等级全价 ¥4,950
      </p>
      <Button 
        onClick={() => navigate('/partner/youjin-intro')}
        className="bg-gradient-to-r from-orange-500 to-amber-500"
      >
        立即升级 →
      </Button>
    </CardContent>
  </Card>
)}
```

### 涉及文件

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| `supabase/functions/wechat-pay-callback/index.ts` | 修改 | 增加有劲合伙人购买/升级处理 |
| `supabase/functions/create-wechat-order/index.ts` | 修改 | 增加降级校验，保持全价 |
| `src/pages/YoujinPartnerIntro.tsx` | 修改 | 识别已有合伙人状态，显示升级按钮 |
| `src/components/partner/YoujinPartnerDashboard.tsx` | 修改 | 增加升级提示入口 |

### 用户流程

```text
┌─────────────────────────────────────────────────────────────────┐
│  L1合伙人升级流程                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 合伙人中心看到"升级到钻石合伙人"卡片                          │
│     ↓                                                           │
│  2. 进入介绍页，看到提示"升级需支付全价"                          │
│     ↓                                                           │
│  3. L3按钮显示"升级购买 ¥4,950"                                  │
│     ↓                                                           │
│  4. 支付成功后：                                                 │
│     - partner_level: L1 → L3                                    │
│     - prepurchase_count: 100 → 1000（覆盖，非叠加）              │
│     - commission_rate_l1: 0.18 → 0.50                           │
│     - commission_rate_l2: 0 → 0.12                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 营销话术

在介绍页和对比表增加提示：

```text
💎 一步到位更划算！

直接购买钻石：¥4,950
先买初级再升级：¥792 + ¥4,950 = ¥5,742

选择钻石，省 ¥792！
```

### 同步数据库佣金

```sql
UPDATE partner_level_rules 
SET commission_rate_l1 = 0.18, commission_rate_l2 = 0.00,
    benefits = ARRAY['全产品18%佣金', '专属推广二维码', '100份体验包分发权', '合伙人专属社群']
WHERE level_name = 'L1' AND partner_type = 'youjin';

UPDATE partner_level_rules 
SET commission_rate_l1 = 0.30, commission_rate_l2 = 0.05,
    benefits = ARRAY['全产品30%佣金', '二级5%佣金', '专属推广二维码', '500份体验包分发权', '优先活动参与权', '专属运营支持']
WHERE level_name = 'L2' AND partner_type = 'youjin';

UPDATE partner_level_rules 
SET commission_rate_l1 = 0.50, commission_rate_l2 = 0.12,
    benefits = ARRAY['全产品50%佣金', '二级12%佣金', '1000份体验包分发权', 'VIP活动邀请', '专属客户经理', '定制化营销物料']
WHERE level_name = 'L3' AND partner_type = 'youjin';
```

