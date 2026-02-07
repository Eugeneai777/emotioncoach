

## 修复支付宝订单显示「微信支付」标签的问题

### 问题分析

从数据库记录中确认，支付宝订单的 `pay_type` 字段已正确存储为 `alipay_h5`：
```
order_no: ALI20260207070549TMZ3W8
pay_type: alipay_h5
status: paid
```

**但问题出在前端显示逻辑**：两个组件在查询 `orders` 表时没有读取 `pay_type` 字段，而是硬编码为 `wechat_pay`。

---

### 需要修改的文件

| 文件 | 问题 | 修复方案 |
|------|------|----------|
| `src/components/PurchaseHistory.tsx` | 查询时未取 `pay_type`，硬编码 `source: 'wechat_pay'` | 读取 `pay_type` 并根据值动态设置来源 |
| `src/components/admin/UserDetailDialog.tsx` | 同上 | 同上 |

---

### 技术实现

#### 1. `PurchaseHistory.tsx` 修改

**查询部分（第 29 行）**：
```typescript
// 修改前
.select('id, order_no, package_name, amount, status, paid_at, created_at')

// 修改后（增加 pay_type）
.select('id, order_no, package_name, amount, status, paid_at, created_at, pay_type')
```

**类型定义（第 10 行）**：
```typescript
// 修改前
source: 'wechat_pay' | 'admin_charge';

// 修改后（增加支付宝类型）
source: 'wechat_pay' | 'alipay_pay' | 'admin_charge';
```

**数据映射（第 46 行）**：
```typescript
// 修改前
source: 'wechat_pay' as const,

// 修改后（根据 pay_type 动态判断）
source: (o.pay_type === 'alipay_h5' ? 'alipay_pay' : 'wechat_pay') as const,
```

**显示标签（第 145 行）**：
```typescript
// 修改前
{purchase.source === 'wechat_pay' ? '微信支付' : '管理员充值'}

// 修改后
{purchase.source === 'alipay_pay' ? '支付宝' : 
 purchase.source === 'wechat_pay' ? '微信支付' : '管理员充值'}
```

**图标显示（第 81-86 行）**：
```typescript
// 增加支付宝图标
const getSourceIcon = (source: 'wechat_pay' | 'alipay_pay' | 'admin_charge') => {
  if (source === 'alipay_pay') {
    return <CreditCard className="h-4 w-4 text-blue-600" />;
  }
  if (source === 'wechat_pay') {
    return <CreditCard className="h-4 w-4 text-green-600" />;
  }
  return <Gift className="h-4 w-4 text-amber-600" />;
};
```

#### 2. `UserDetailDialog.tsx` 修改

**查询部分（第 233 行）**：
```typescript
// 修改前
.select('id, order_no, package_name, amount, status, created_at')

// 修改后
.select('id, order_no, package_name, amount, status, created_at, pay_type')
```

**类型定义**：
在 `PurchaseRecord` 接口的 `source` 类型中增加 `'alipay_pay'`

**数据映射（第 259 行）**：
```typescript
// 修改前
source: 'wechat_pay',

// 修改后
source: order.pay_type === 'alipay_h5' ? 'alipay_pay' : 'wechat_pay',
```

**显示标签（约第 596 行）**：
```typescript
// 修改前
{record.source === 'wechat_pay' ? '微信支付' : ...}

// 修改后
{record.source === 'alipay_pay' ? '支付宝' :
 record.source === 'wechat_pay' ? '微信支付' : ...}
```

---

### 预期效果

修复后，用户在「购买历史」中将看到：
- 支付宝订单显示 **「支付宝」** 标签（蓝色图标）
- 微信订单显示 **「微信支付」** 标签（绿色图标）
- 管理员充值显示 **「管理员充值」** 标签（橙色图标）

