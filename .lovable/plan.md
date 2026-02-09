

## 绽放合伙人批量名单更新 + 权益赋予方案

### 需求概述

将 54 位绽放合伙人的邀请记录替换为新名单（含手机号），并在邀请领取（claim）流程中自动赋予两项额外权益：
- 财富卡点测评（wealth_block_assessment）
- 21天财富觉醒训练营（wealth_block_7 / camp）

### 实施步骤

#### 1. 数据清理与重新导入

通过 SQL 操作完成：

- **删除现有未领取的 bloom 邀请**：清除当前 54 条 `status='pending'` 的记录
- **插入新名单**：54 人（含姓名 + 手机号），每人生成唯一 BLOOM 邀请码

这将通过数据库 insert 工具执行，不涉及 schema 变更。

#### 2. 修改 claim-partner-invitation 边缘函数

在用户领取邀请码成为绽放合伙人时，自动创建以下权益记录：

**a) 财富卡点测评权益**
- 在 `orders` 表中插入一条 `amount=0, status='paid'` 的订单
- `package_key='wealth_block_assessment'`，`order_type='partner_benefit'`

**b) 21天财富觉醒训练营权益**
- 在 `user_camp_purchases` 表中插入一条 `purchase_price=0, payment_status='completed'` 的记录
- `camp_type='wealth_block_7'`，`payment_method='partner_benefit'`

#### 3. 不涉及的变更

- 无数据库 schema 变更
- 不修改前端批量导入组件（数据直接通过 SQL 导入）
- 不修改前端权益检查逻辑（已有的 `useCampPurchase`/`useCampEntitlement` 会自动识别新记录）

### 技术细节

**claim-partner-invitation 函数修改要点：**

在成功创建 partner 记录和 bloom_partner_orders 之后，添加两段逻辑：

```typescript
// 1. 赋予财富卡点测评权益
await adminClient.from('orders').insert({
  user_id: userId,
  package_key: 'wealth_block_assessment',
  package_name: '财富卡点测评',
  amount: 0,
  order_no: `BLOOM-WB-${Date.now()}`,
  status: 'paid',
  paid_at: new Date().toISOString(),
  order_type: 'partner_benefit',
  product_name: '财富卡点测评（绽放合伙人权益）',
});

// 2. 赋予21天财富觉醒训练营权益
await adminClient.from('user_camp_purchases').insert({
  user_id: userId,
  camp_type: 'wealth_block_7',
  camp_name: '7天财富突破训练营',
  purchase_price: 0,
  payment_method: 'partner_benefit',
  payment_status: 'completed',
});
```

**数据导入格式（54 人完整名单带手机号）：**
所有人的手机号已从用户提供的名单中提取，将作为 `invitee_phone` 字段写入 `partner_invitations` 表。

