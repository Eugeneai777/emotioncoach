
# 优化价格输入框体验

## 问题
当前"现价"输入框使用 `type="number"` 且初始值为 `0`，导致：
- 用户无法直接清空输入框
- 必须先输入数字（如 "0299"），再删除前面的 "0"

## 解决方案
将价格输入框改为文本类型，允许输入框为空，同时保持数字验证逻辑。

## 技术实现

### 修改文件
`src/components/admin/camps/PricingTab.tsx`

### 改动内容

1. **现价输入框改为文本类型，允许为空**

```tsx
<Input
  id="price"
  type="text"
  inputMode="decimal"
  value={formData.price === 0 ? '' : formData.price.toString()}
  onChange={(e) => {
    const val = e.target.value;
    // 允许空值或有效数字
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      updateFormData({ price: val === '' ? 0 : parseFloat(val) || 0 });
    }
  }}
  placeholder="0"
/>
```

2. **原价输入框同样优化**

```tsx
<Input
  id="original_price"
  type="text"
  inputMode="decimal"
  value={formData.original_price === 0 ? '' : formData.original_price.toString()}
  onChange={(e) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      updateFormData({ original_price: val === '' ? 0 : parseFloat(val) || 0 });
    }
  }}
  placeholder="0"
/>
```

## 预期效果

| 操作 | 当前行为 | 优化后 |
|:-----|:---------|:-------|
| 清空输入框 | 无法清空，始终显示0 | 可以清空，显示placeholder |
| 输入新价格 | 需要输入后再删0 | 直接输入即可 |
| 保存空值 | - | 自动转为0保存 |

## 文件清单

| 文件 | 操作 |
|:-----|:-----|
| src/components/admin/camps/PricingTab.tsx | 修改：优化价格输入框为文本类型，允许为空 |
