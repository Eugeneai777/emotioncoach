

## 全站手机端文字换行问题修复

### 排查结果

经过全站扫描，发现以下位置在手机端（375px宽度）存在文字被迫换行或挤压的问题：

### 需要修复的位置

| # | 文件 | 行号 | 问题描述 |
|---|------|------|---------|
| 1 | `PartnerEarningsComparison.tsx` | 172-178 | ROI计算行：5个元素挤在一个flex行中（"多投入 ¥1,733" → "多赚 ¥4,100" = "回报率 237%"），手机端必定换行且断裂 |
| 2 | `YoujinPartnerIntro.tsx` | 291-292 | 省钱提示文字过长："直接购买钻石：¥4,950 \| 先买初级再升级：¥792 + ¥4,950 = ¥5,742"，在手机端会断行显示不整齐 |
| 3 | `YoujinPartnerIntro.tsx` | 328 | 等级卡片价格行："100份体验包 · 1年有效" 和 ¥xxx 在 flex justify-between 中，价格区域被挤压 |
| 4 | `YoujinPartnerIntro.tsx` | 332-340 | 佣金标签行：两个 badge（"全产品 50% 佣金" + "二级 12% 佣金"）在 flex gap-3 中可能换行 |
| 5 | `YoujinPartnerPlan.tsx` | 587 | "7款可分成产品 × 三大场景 = 多元收益来源" 使用 text-xl font-bold，手机端会换行 |

### 修改方案

**1. `PartnerEarningsComparison.tsx`（第172-178行）**
将ROI计算从单行flex改为两行居中堆叠：
```tsx
// 之前：5个元素挤在一行
<div className="flex items-center justify-center gap-2 text-xs ...">

// 之后：改为flex-wrap或分两行
<div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs ...">
```

**2. `YoujinPartnerIntro.tsx`（第291-292行）**
将省钱对比拆为两行显示：
```tsx
// 之前
直接购买钻石：¥4,950 | 先买初级再升级：¥792 + ¥4,950 = ¥5,742

// 之后：用<br/>或两个<p>分行
<p>直接买钻石：¥4,950</p>
<p>先买初级再升：¥792+¥4,950=¥5,742</p>
```

**3. `YoujinPartnerIntro.tsx`（第313-329行）**  
等级卡片头部在手机端需要改为上下布局而非左右flex：
```tsx
// 将 flex items-center justify-between 改为 flex flex-col 在小屏
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
```

**4. `YoujinPartnerIntro.tsx`（第332-340行）**
佣金标签添加 `flex-wrap`：
```tsx
<div className="flex flex-wrap gap-2">
```

**5. `YoujinPartnerPlan.tsx`（第587行）**
缩短文案或减小字号：
```tsx
// text-xl → text-base sm:text-xl
<p className="text-base sm:text-xl font-bold">
```

### 涉及文件

- `src/components/partner/PartnerEarningsComparison.tsx` -- ROI行改为允许换行
- `src/pages/YoujinPartnerIntro.tsx` -- 省钱提示拆行、卡片布局响应式、佣金标签flex-wrap
- `src/pages/YoujinPartnerPlan.tsx` -- 标题字号响应式

