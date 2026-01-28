
# 将情绪健康测评和 SCL-90 测评加入合伙人体验包

## 需求分析

用户希望：
1. **将情绪健康测评和 SCL-90 测评加入合伙人体验包**：领取体验包后自动获得这两个测评的使用权限
2. **确认 SCL-90 价格为 ¥9.9**：数据库查询显示已经是 9.9，无需修改

## 当前系统架构

| 组件 | 说明 |
|:----|:-----|
| `orders` 表 | 存储购买记录，通过 `package_key` + `status='paid'` 判断权限 |
| `useSCL90Purchase` / `useEmotionHealthPurchase` | 检查 orders 表中对应产品的已支付记录 |
| `claim-partner-entry` Edge Function | 合伙人体验包领取逻辑，目前只发放 AI 点数 |

### 权限检查流程

```
用户访问测评 → 检查 orders 表
                 ↓
    package_key = 'scl90_report' / 'emotion_health_assessment'
    status = 'paid'
                 ↓
    存在 → 已购买，可访问
    不存在 → 显示付费墙
```

## 解决方案

在 `claim-partner-entry` Edge Function 中，除了发放 AI 点数外，额外为用户创建两条"已支付"的订单记录：

| package_key | package_name | amount |
|:------------|:-------------|:-------|
| `emotion_health_assessment` | 情绪健康测评 | 0 (赠送) |
| `scl90_report` | SCL-90心理测评报告 | 0 (赠送) |

## 技术实现

### 修改文件：`supabase/functions/claim-partner-entry/index.ts`

在发放 AI 点数的逻辑之后，添加创建赠送订单的代码：

```typescript
// 创建赠送的测评订单（情绪健康测评 + SCL-90）
const assessmentPackages = [
  { 
    package_key: 'emotion_health_assessment', 
    package_name: '情绪健康测评',
    package_id: 'd4dc5f59-bda0-4a6f-a786-e9e79c2369b9'  // 从数据库获取
  },
  { 
    package_key: 'scl90_report', 
    package_name: 'SCL-90心理测评报告',
    package_id: '490f0aff-8bd2-4644-8e44-3d4cf3844f1c'  // 从数据库获取
  }
];

for (const pkg of assessmentPackages) {
  // 检查是否已有该产品的订单（避免重复）
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', user.id)
    .eq('package_key', pkg.package_key)
    .eq('status', 'paid')
    .maybeSingle();

  if (!existingOrder) {
    // 创建赠送订单
    const orderNo = `YJ${Date.now()}GIFT${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    
    await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        package_key: pkg.package_key,
        package_name: pkg.package_name,
        amount: 0,
        status: 'paid',
        paid_at: new Date().toISOString(),
        order_no: orderNo,
        // 可选：添加备注字段记录来源
      });
      
    console.log(`Granted ${pkg.package_key} to user ${user.id}`);
  }
}
```

### 完整修改逻辑

1. **在现有领取逻辑之后添加**：避免影响核心功能
2. **检查是否已拥有**：防止重复赠送
3. **使用 `status: 'paid'`**：与购买逻辑一致
4. **金额为 0**：标识为赠送
5. **生成唯一订单号**：包含 GIFT 标识便于追踪

## 订单表字段映射

根据已有订单数据：

| 字段 | 值 | 说明 |
|:----|:---|:-----|
| `user_id` | 用户 ID | 必填 |
| `package_key` | `emotion_health_assessment` / `scl90_report` | 产品标识 |
| `package_name` | 测评名称 | 显示名 |
| `amount` | `0` | 赠送标识 |
| `status` | `paid` | 权限检查依赖此字段 |
| `paid_at` | 当前时间 | 记录赠送时间 |
| `order_no` | 生成的订单号 | 唯一标识 |

## 用户体验

领取体验包后，用户将获得：

| 权益 | 原值 | 体验包 |
|:----|:-----|:------|
| AI 对话点数 | ¥9.9 (50点) | ✅ 赠送 |
| 情绪健康测评 | ¥9.9 | ✅ 赠送 |
| SCL-90 心理测评 | ¥9.9 | ✅ 赠送 |
| **总价值** | **¥29.7** | **免费** |

## 成功响应更新

更新返回消息，告知用户获得的完整权益：

```typescript
return new Response(
  JSON.stringify({ 
    success: true, 
    message: `成功领取体验套餐！`,
    quota_amount: quotaAmount,
    duration_days: durationDays,
    included_assessments: ['emotion_health_assessment', 'scl90_report']
  }),
  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);
```

## 安全考虑

1. **幂等性**：检查已有订单，避免重复赠送
2. **原子性**：订单创建失败不影响主流程（AI 点数仍会发放）
3. **审计追踪**：订单号包含 GIFT 标识，金额为 0，便于区分赠送订单

## 文件清单

| 文件 | 操作 | 说明 |
|:----|:-----|:-----|
| `supabase/functions/claim-partner-entry/index.ts` | 修改 | 添加测评赠送逻辑 |

## 注意事项

- **SCL-90 价格已经是 ¥9.9**：数据库查询确认无需修改
- **情绪健康测评价格也是 ¥9.9**：与 SCL-90 保持一致
