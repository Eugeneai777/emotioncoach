
# 教练咨询预付卡系统实现计划

## 概述

为真人教练服务添加预付卡功能，允许用户预先充值一定金额，预约教练服务时可选择从预付卡余额扣款，而非每次都通过微信支付。

---

## 当前系统分析

| 组件 | 现状 |
|:-----|:-----|
| `user_accounts` 表 | 仅用于 AI 对话次数配额（total_quota, used_quota） |
| `create-appointment-order` | 每次预约都创建微信支付订单 |
| `AppointmentPayDialog` | 仅支持微信支付流程 |
| 教练服务价格 | `coach_services.price` 以人民币计价（如 ¥99/次） |

---

## 设计方案

### 核心思路

创建独立的**教练咨询预付卡余额**系统，与现有的 AI 对话次数配额分离：
- **AI 配额**：按"次数"计算（现有 `user_accounts.total_quota`）
- **教练预付卡**：按"金额"计算（新增 `coaching_balance` 字段或独立表）

### 方案选择：扩展现有表 vs 新建表

推荐**新建独立表** `coaching_prepaid_cards`，原因：
1. 业务逻辑完全独立，避免与 AI 配额混淆
2. 支持多张预付卡、不同有效期
3. 便于追踪充值和消费记录
4. 支持未来的退款、转赠等功能扩展

---

## 数据库设计

### 新建表 1: coaching_prepaid_balance（用户教练余额）

```sql
CREATE TABLE public.coaching_prepaid_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_recharged DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### 新建表 2: coaching_prepaid_transactions（充值/消费记录）

```sql
CREATE TABLE public.coaching_prepaid_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('recharge', 'consume', 'refund', 'admin_adjust')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  related_order_no TEXT,
  related_appointment_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 新建表 3: coaching_prepaid_packages（预付卡套餐配置）

```sql
CREATE TABLE public.coaching_prepaid_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name TEXT NOT NULL,
  package_key TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  total_value DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

示例数据：
| 套餐名称 | 售价 | 赠送 | 实际到账 |
|:---------|:-----|:-----|:---------|
| 入门充值卡 | ¥100 | ¥0 | ¥100 |
| 畅享充值卡 | ¥500 | ¥50 | ¥550 |
| 尊享充值卡 | ¥1000 | ¥150 | ¥1150 |

---

## 业务流程设计

### 流程 1: 购买预付卡

```text
用户选择预付卡套餐
       ↓
创建充值订单（orders表，order_type='prepaid_recharge'）
       ↓
微信支付
       ↓
支付成功回调
       ↓
更新 coaching_prepaid_balance（增加余额）
       ↓
记录 coaching_prepaid_transactions
```

### 流程 2: 使用预付卡预约教练

```text
用户完成预约流程（选服务 → 选时间 → 填留言）
       ↓
显示支付方式选择：
  - 预付卡余额（显示当前余额）
  - 微信支付（原有流程）
       ↓
若选择预付卡且余额充足：
  → 直接扣款，创建已支付的预约
  → 记录消费流水
       ↓
若余额不足：
  → 提示充值或切换微信支付
```

---

## 文件修改清单

### 数据库迁移
| 操作 | 说明 |
|:-----|:-----|
| 创建表 | `coaching_prepaid_balance` |
| 创建表 | `coaching_prepaid_transactions` |
| 创建表 | `coaching_prepaid_packages` |
| RLS 策略 | 用户只能查看/操作自己的余额和记录 |
| 数据库函数 | `deduct_coaching_balance` - 原子性扣款 |
| 数据库函数 | `add_coaching_balance` - 原子性充值 |
| 插入数据 | 预付卡套餐初始数据 |

### Edge Functions

| 文件 | 类型 | 说明 |
|:-----|:-----|:-----|
| `supabase/functions/create-prepaid-recharge-order/index.ts` | 新建 | 创建预付卡充值订单 |
| `supabase/functions/pay-with-prepaid/index.ts` | 新建 | 预付卡扣款预约教练 |
| `supabase/functions/wechat-pay-callback/index.ts` | 修改 | 处理预付卡充值成功回调 |

### 前端组件

| 文件 | 类型 | 说明 |
|:-----|:-----|:-----|
| `src/hooks/useCoachingPrepaid.ts` | 新建 | 查询余额、充值、消费记录 |
| `src/components/coaching/PrepaidBalanceCard.tsx` | 新建 | 显示预付卡余额卡片 |
| `src/components/coaching/PrepaidRechargeDialog.tsx` | 新建 | 预付卡充值弹窗 |
| `src/components/coaching/PrepaidPackageList.tsx` | 新建 | 预付卡套餐列表 |
| `src/components/human-coach/booking/PaymentMethodSelector.tsx` | 新建 | 支付方式选择器 |
| `src/components/human-coach/booking/BookingDialog.tsx` | 修改 | 集成支付方式选择 |
| `src/components/human-coach/booking/AppointmentPayDialog.tsx` | 修改 | 支持预付卡支付路径 |
| `src/pages/Packages.tsx` | 修改 | 添加教练预付卡入口 |

---

## 技术实现细节

### 数据库函数：原子性扣款

```sql
CREATE OR REPLACE FUNCTION public.deduct_coaching_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_appointment_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
BEGIN
  -- 锁定行防止并发问题
  SELECT balance INTO v_current_balance
  FROM public.coaching_prepaid_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, '账户不存在'::TEXT;
    RETURN;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT FALSE, v_current_balance, '余额不足'::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  -- 更新余额
  UPDATE public.coaching_prepaid_balance
  SET balance = v_new_balance,
      total_spent = total_spent + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- 记录流水
  INSERT INTO public.coaching_prepaid_transactions
    (user_id, type, amount, balance_after, related_appointment_id, description)
  VALUES
    (p_user_id, 'consume', -p_amount, v_new_balance, p_appointment_id, p_description);

  RETURN QUERY SELECT TRUE, v_new_balance, '扣款成功'::TEXT;
END;
$$;
```

### 前端支付方式选择器

```typescript
// PaymentMethodSelector.tsx
interface PaymentMethodSelectorProps {
  price: number;
  prepaidBalance: number;
  selectedMethod: 'prepaid' | 'wechat';
  onMethodChange: (method: 'prepaid' | 'wechat') => void;
}

// 显示两个选项：
// 1. 预付卡余额 ¥{balance} [选中时显示√]
//    - 余额不足时显示"余额不足，去充值"
// 2. 微信支付 [选中时显示√]
```

### Edge Function: pay-with-prepaid

```typescript
// 核心逻辑
1. 验证用户身份
2. 获取服务价格和时间槽信息
3. 调用 deduct_coaching_balance 扣款
4. 创建 coaching_appointments 记录（状态直接为 confirmed）
5. 创建 orders 记录（状态直接为 paid，pay_type='prepaid'）
6. 发送预约确认通知
```

---

## UI 设计要点

### 预付卡余额卡片

```text
┌─────────────────────────────────┐
│  💳 教练咨询预付卡              │
│                                 │
│  余额: ¥ 550.00                 │
│                                 │
│  [充值]  [消费记录]              │
└─────────────────────────────────┘
```

### 支付方式选择

```text
┌─────────────────────────────────┐
│  选择支付方式                    │
│                                 │
│  ○ 预付卡余额  ¥550.00          │
│    本次消费 ¥99.00，剩余 ¥451   │
│                                 │
│  ○ 微信支付                     │
│                                 │
│        [确认预约]               │
└─────────────────────────────────┘
```

---

## 安全考虑

1. **RLS 策略**：用户只能查看和操作自己的余额
2. **原子性扣款**：使用 `FOR UPDATE` 锁防止并发超扣
3. **双重验证**：Edge Function 验证用户身份 + 数据库 RLS
4. **流水完整**：所有充值/消费都有记录可追溯
5. **退款保护**：取消预约时记录退款流水

---

## 实现顺序

1. **数据库层**：创建表、函数、RLS 策略、初始数据
2. **Edge Functions**：充值订单、预付卡扣款、回调处理
3. **前端 Hooks**：余额查询、充值、消费
4. **UI 组件**：余额卡片、充值弹窗、支付选择器
5. **集成测试**：完整流程验证
