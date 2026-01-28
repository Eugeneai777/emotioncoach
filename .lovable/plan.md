

# 赠送金额与教练结算方案

## 核心问题

当前系统将用户充值时的赠送金额直接合并到余额中，导致：
- 无法区分「实付金额」和「赠送金额」的来源
- 教练结算时按服务全价计算，平台需要承担赠送部分的成本

**示例**：
用户充 ¥1000 → 获得 ¥1100 余额（含 ¥100 赠送）
预约 ¥200 服务 → 结算给教练 ¥60（30%佣金）
问题：¥200 中有多少是实付？多少是赠送？

---

## 解决方案：双余额追踪

将用户余额拆分为两个独立账户：

| 账户类型 | 说明 | 结算参与 |
|:---------|:-----|:---------|
| 实付余额 (paid_balance) | 用户实际支付的金额 | 参与教练结算 |
| 赠送余额 (bonus_balance) | 平台赠送的金额 | 不参与教练结算 |

**消费逻辑**：
- 优先扣减「赠送余额」（降低平台成本）
- 赠送余额不足时，再扣减「实付余额」

**结算逻辑**：
- 仅按「实付金额扣减部分」计算教练佣金

---

## 数据库变更

### 1. 修改 coaching_prepaid_balance 表

```sql
ALTER TABLE coaching_prepaid_balance
ADD COLUMN paid_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN bonus_balance DECIMAL(12,2) NOT NULL DEFAULT 0;

-- 迁移现有数据（假设历史充值无赠送）
UPDATE coaching_prepaid_balance
SET paid_balance = balance,
    bonus_balance = 0;
```

### 2. 修改 coaching_prepaid_transactions 表

```sql
ALTER TABLE coaching_prepaid_transactions
ADD COLUMN paid_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN bonus_amount DECIMAL(12,2) DEFAULT 0;
```

### 3. 修改 coaching_appointments 表

```sql
ALTER TABLE coaching_appointments
ADD COLUMN paid_portion DECIMAL(12,2) DEFAULT 0,
ADD COLUMN bonus_portion DECIMAL(12,2) DEFAULT 0;
```

---

## 业务逻辑变更

### 充值流程

**文件**: `supabase/functions/wechat-pay-callback/index.ts`

```
用户充值 ¥1000 (套餐 total_value = ¥1100, bonus_amount = ¥100)
  ↓
paid_balance += 1000  (实付)
bonus_balance += 100  (赠送)
```

### 消费流程

**文件**: `supabase/functions/pay-with-prepaid/index.ts`

```
预约服务 ¥200
  ↓
Step 1: 检查总余额 (paid_balance + bonus_balance >= 200)
Step 2: 优先扣减赠送余额
  - 如果 bonus_balance >= 200 → bonus_portion = 200, paid_portion = 0
  - 如果 bonus_balance = 50  → bonus_portion = 50, paid_portion = 150
Step 3: 记录到预约 (paid_portion, bonus_portion)
```

### 结算流程

**文件**: `supabase/functions/calculate-coach-settlement/index.ts`

```
结算计算 (评价后触发)
  ↓
读取预约的 paid_portion (仅实付部分)
settlement_amount = paid_portion × base_rate × rating_multiplier
```

---

## 计算示例

**用户操作**：
1. 充值 ¥1000 → paid: ¥1000, bonus: ¥100
2. 预约 ¥200 服务 → bonus 扣 ¥100, paid 扣 ¥100
3. 5 星评价结算 → ¥100 × 30% × 1.0 = ¥30 给教练

**对比原方案**：
- 原方案：¥200 × 30% = ¥60 给教练
- 新方案：¥100 × 30% = ¥30 给教练
- 平台节省：¥30

---

## 修改文件清单

| 文件 | 操作 | 说明 |
|:-----|:-----|:-----|
| 数据库迁移 | 新增 | 添加双余额字段 |
| `add_coaching_balance` 函数 | 修改 | 分别增加 paid 和 bonus |
| `deduct_coaching_balance` 函数 | 修改 | 优先扣 bonus，返回扣减明细 |
| `pay-with-prepaid/index.ts` | 修改 | 记录 paid_portion 和 bonus_portion |
| `calculate-coach-settlement/index.ts` | 修改 | 仅按 paid_portion 结算 |
| `useCoachSettlements.ts` | 可选 | 展示实付/赠送明细 |

---

## 技术细节

### 新版 deduct_coaching_balance 函数

```sql
CREATE OR REPLACE FUNCTION deduct_coaching_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  ...
)
RETURNS TABLE(
  success BOOLEAN,
  new_balance DECIMAL,
  paid_deducted DECIMAL,  -- 新增：实付扣减金额
  bonus_deducted DECIMAL, -- 新增：赠送扣减金额
  message TEXT
)
AS $$
DECLARE
  v_bonus DECIMAL;
  v_paid DECIMAL;
  v_bonus_deduct DECIMAL;
  v_paid_deduct DECIMAL;
BEGIN
  -- 获取两种余额
  SELECT bonus_balance, paid_balance INTO v_bonus, v_paid
  FROM coaching_prepaid_balance WHERE user_id = p_user_id FOR UPDATE;
  
  -- 优先扣赠送
  IF v_bonus >= p_amount THEN
    v_bonus_deduct := p_amount;
    v_paid_deduct := 0;
  ELSE
    v_bonus_deduct := v_bonus;
    v_paid_deduct := p_amount - v_bonus;
  END IF;
  
  -- 更新余额
  UPDATE coaching_prepaid_balance
  SET bonus_balance = bonus_balance - v_bonus_deduct,
      paid_balance = paid_balance - v_paid_deduct,
      balance = balance - p_amount
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT TRUE, (v_paid + v_bonus - p_amount), 
                       v_paid_deduct, v_bonus_deduct, '扣款成功'::TEXT;
END;
$$
```

---

## 迁移策略

1. **历史数据**：将现有 `balance` 全部视为 `paid_balance`（保守处理）
2. **新充值**：按套餐的 `price` 和 `bonus_amount` 分别记账
3. **结算兼容**：对于没有 `paid_portion` 的旧预约，按 `amount_paid` 全额结算

