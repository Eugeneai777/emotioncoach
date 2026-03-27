

# 修复「7天有劲训练营」卡片：购买按钮 → 查看详情

## 问题

当前 `CampTemplateCard` 底部对未购买用户显示"购买 ¥0.01"按钮，点击后直接触发 `onPurchase` 支付流程。用户没有机会先了解产品详情，体验突兀。

而卡片的 `onClick`（点击卡片整体）已正确跳转到 `/promo/synergy`，但底部按钮的 `e.stopPropagation()` 阻止了事件冒泡，走了独立的购买逻辑。

## 方案

在 `CampTemplateCard.tsx` 中，对 `emotion_stress_7` 类型的卡片，将底部按钮从"购买 ¥X"改为"查看详情"，点击时走 `onClick`（跳转 `/promo/synergy`）而非 `onPurchase`。

### 具体改动

**文件：`src/components/camp/CampTemplateCard.tsx`**

在第 215-226 行的付费未购买按钮区域，增加对 `emotion_stress_7` 的特殊处理：

```typescript
) : isPaidCamp && !hasPurchased ? (
  camp.camp_type === 'emotion_stress_7' ? (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onClick(); // 走卡片点击逻辑 → /promo/synergy
      }}
      className="w-full gap-2 bg-gradient-to-r from-slate-700 to-amber-600 hover:opacity-90 text-white"
      size="sm"
    >
      查看详情
    </Button>
  ) : (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onPurchase?.(camp);
      }}
      className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all"
      size="sm"
    >
      <ShoppingCart className="w-4 h-4" />
      购买 ¥{formatMoney(camp.price)}
    </Button>
  )
)
```

按钮颜色使用与卡片一致的 slate-amber 渐变风格，保持视觉统一。

### 改动范围

仅 `src/components/camp/CampTemplateCard.tsx` 一个文件，约 10 行改动。

