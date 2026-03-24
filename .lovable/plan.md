

# 修复 /parent-camp 购买弹框

## 问题

`/parent-camp`（ParentCampLanding.tsx）在传递 `campTemplate` 给 `StartCampDialog` 时，手动构造了对象但**遗漏了 `price`、`original_price`、`price_note` 字段**。这导致 `StartCampDialog` 内部判断 `isFree = true`，跳过了购买流程，用户未购买也能直接开营。

而 `/parent-coach` 页面直接传入了完整的 `parentCampTemplate` 对象（包含价格信息），所以购买弹框正常弹出。

## 修改方案

**仅修改 1 个文件**：`src/pages/ParentCampLanding.tsx`

将 `StartCampDialog` 的 `campTemplate` prop 从手动构造改为传入完整的 `campTemplate` 对象（与 `/parent-coach` 一致）：

```tsx
// 之前（缺少价格字段）
<StartCampDialog
  campTemplate={{
    camp_type: campTemplate.camp_type,
    camp_name: campTemplate.camp_name,
    duration_days: campTemplate.duration_days,
    icon: campTemplate.icon
  }}
  ...
/>

// 之后（传入完整对象）
<StartCampDialog
  campTemplate={campTemplate}
  ...
/>
```

这样 `StartCampDialog` 就能读取到 `price`、`original_price`、`price_note`，在用户未购买时正确弹出购买弹框。

