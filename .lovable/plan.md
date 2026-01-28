
# 充值套餐调整计划

## 当前套餐

| 套餐名称 | 价格 | 赠送 | 到账 |
|:---------|:-----|:-----|:-----|
| 入门充值卡 | ¥100 | ¥0 | ¥100 |
| 畅享充值卡 | ¥500 | ¥50 | ¥550 |
| 尊享充值卡 | ¥1000 | ¥150 | ¥1150 |

---

## 新套餐设计

按比例赠送规则：
- ¥1000 → 送 10% = ¥100
- ¥5000 → 送 15% = ¥750
- ¥10000 → 送 20% = ¥2000

| 套餐名称 | 价格 | 赠送 | 到账 | 赠送比例 |
|:---------|:-----|:-----|:-----|:---------|
| 标准充值卡 | ¥1000 | ¥100 | ¥1100 | 10% |
| 畅享充值卡 | ¥5000 | ¥750 | ¥5750 | 15% |
| 尊享充值卡 | ¥10000 | ¥2000 | ¥12000 | 20% |

---

## 数据库操作

### 方案：更新现有记录 + 停用旧套餐

```sql
-- 1. 停用旧的入门充值卡 (¥100)
UPDATE coaching_prepaid_packages 
SET is_active = false 
WHERE package_key = 'prepaid_100';

-- 2. 停用旧的畅享充值卡 (¥500)
UPDATE coaching_prepaid_packages 
SET is_active = false 
WHERE package_key = 'prepaid_500';

-- 3. 更新现有 ¥1000 套餐
UPDATE coaching_prepaid_packages 
SET 
  package_name = '标准充值卡',
  bonus_amount = 100.00,
  total_value = 1100.00,
  description = '充1000送100，到账¥1100',
  display_order = 1
WHERE package_key = 'prepaid_1000';

-- 4. 新增 ¥5000 套餐
INSERT INTO coaching_prepaid_packages 
  (package_key, package_name, price, bonus_amount, total_value, description, display_order)
VALUES 
  ('prepaid_5000', '畅享充值卡', 5000.00, 750.00, 5750.00, '充5000送750，到账¥5750', 2);

-- 5. 新增 ¥10000 套餐
INSERT INTO coaching_prepaid_packages 
  (package_key, package_name, price, bonus_amount, total_value, description, display_order)
VALUES 
  ('prepaid_10000', '尊享充值卡', 10000.00, 2000.00, 12000.00, '充10000送2000，到账¥12000', 3);
```

---

## 技术细节

| 操作 | 说明 |
|:-----|:-----|
| 停用旧套餐 | `is_active = false`，不删除以保留历史订单关联 |
| 复用 prepaid_1000 | 更新为新的标准套餐 |
| 新增两个套餐 | prepaid_5000 和 prepaid_10000 |

---

## 修改后效果

用户在"绽放教练"Tab 看到的充值选项：

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│   标准充值卡    │ │   畅享充值卡    │ │   尊享充值卡    │
│    ¥1000       │ │    ¥5000       │ │   ¥10000      │
│   送 ¥100      │ │   送 ¥750      │ │   送 ¥2000    │
│  到账 ¥1100    │ │  到账 ¥5750    │ │  到账 ¥12000   │
└────────────────┘ └────────────────┘ └────────────────┘
```
