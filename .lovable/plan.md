

## 修正教练预付卡充值送礼显示内容

### 问题分析

当前 `ProductComparisonTable.tsx` 中的"充值送礼"区块使用了硬编码的旧数据：

| 当前显示（错误） | 数据库实际值（正确） |
|:-----------------|:---------------------|
| 充值 ¥500 送 ¥50 | 充值 ¥1000 送 ¥100 |
| 充值 ¥1000 送 ¥150 | 充值 ¥5000 送 ¥750 |
| - | 充值 ¥10000 送 ¥2000 |

---

### 数据库当前套餐

| 套餐名称 | 充值金额 | 赠送金额 | 到账金额 | 赠送比例 |
|:---------|:---------|:---------|:---------|:---------|
| 标准充值卡 | ¥1,000 | ¥100 | ¥1,100 | 10% |
| 畅享充值卡 | ¥5,000 | ¥750 | ¥5,750 | 15% |
| 尊享充值卡 | ¥10,000 | ¥2,000 | ¥12,000 | 20% |

---

### 实施方案

**文件**：`src/components/ProductComparisonTable.tsx`

**修改位置**：第189-202行

**修改前**：
```tsx
<ul className="space-y-1.5 text-sm">
  <li className="flex items-center gap-2">
    <Check className="w-4 h-4 text-green-500" />
    <span>充值 ¥500 送 ¥50</span>
  </li>
  <li className="flex items-center gap-2">
    <Check className="w-4 h-4 text-green-500" />
    <span>充值 ¥1000 送 ¥150</span>
  </li>
  <li className="flex items-center gap-2">
    <Check className="w-4 h-4 text-green-500" />
    <span>余额永久有效，可预约所有教练</span>
  </li>
</ul>
```

**修改后**：
```tsx
<ul className="space-y-1.5 text-sm">
  <li className="flex items-center gap-2">
    <Check className="w-4 h-4 text-green-500" />
    <span>充值 ¥1,000 送 ¥100</span>
  </li>
  <li className="flex items-center gap-2">
    <Check className="w-4 h-4 text-green-500" />
    <span>充值 ¥5,000 送 ¥750</span>
  </li>
  <li className="flex items-center gap-2">
    <Check className="w-4 h-4 text-green-500" />
    <span>充值 ¥10,000 送 ¥2,000</span>
  </li>
  <li className="flex items-center gap-2">
    <Check className="w-4 h-4 text-green-500" />
    <span>余额永久有效，可预约所有教练</span>
  </li>
</ul>
```

---

### 涉及文件

| 文件 | 修改内容 |
|:-----|:---------|
| `src/components/ProductComparisonTable.tsx` | 更新充值送礼列表，使用正确的套餐数据 |

---

### 预期效果

**修改后显示**：
- 充值 ¥1,000 送 ¥100
- 充值 ¥5,000 送 ¥750
- 充值 ¥10,000 送 ¥2,000
- 余额永久有效，可预约所有教练

与数据库 `coaching_prepaid_packages` 表中的实际套餐信息一致。

