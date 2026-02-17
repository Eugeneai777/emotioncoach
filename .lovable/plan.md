

## 文字换行问题修复

### 问题定位

从截图中发现两处文字换行问题：

| 文件 | 问题描述 |
|------|---------|
| `src/components/ProductComparisonTable.tsx` 第174行 | "预充值享优惠，余额可用于预约所有教练服务" 在手机端换行为两行，影响视觉整洁 |
| `src/components/partner/PartnerEarningsComparison.tsx` 第119-130行 | 三列对比卡片中 "一级收益" / "二级收益" 文字在窄屏下逐字竖排，严重影响可读性 |

### 修改方案

**1. `ProductComparisonTable.tsx`（第174行）**

副标题文字过长导致换行，缩短文案并保持语义完整：

```tsx
// 之前
<p className="text-sm text-muted-foreground">预充值享优惠，余额可用于预约所有教练服务</p>

// 之后
<p className="text-sm text-muted-foreground whitespace-nowrap">预充值享优惠，余额可预约所有教练</p>
```

**2. `PartnerEarningsComparison.tsx`（第119-130行）**

三列对比卡片内 `flex justify-between` 布局中，"一级收益" 和金额挤在一起导致逐字换行。解决方案：给标签加 `whitespace-nowrap`，并将 `flex justify-between` 改为上下堆叠布局以适应窄屏：

```tsx
// 之前
<div className="flex justify-between">
  <span className="text-muted-foreground">一级收益</span>
  <span className="font-medium">¥{formatMoney(data.l1Earnings)}</span>
</div>

// 之后：改为上下堆叠，标签在上、金额在下
<div className="text-center">
  <div className="text-muted-foreground whitespace-nowrap">一级收益</div>
  <div className="font-medium">¥{formatMoney(data.l1Earnings)}</div>
</div>
```

同样处理 "二级收益" 部分。

### 涉及文件

- `src/components/ProductComparisonTable.tsx` -- 缩短副标题文案 + 加 `whitespace-nowrap`
- `src/components/partner/PartnerEarningsComparison.tsx` -- 收益明细改为上下堆叠布局，防止逐字竖排

