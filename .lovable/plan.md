

# 商品详情页增加"有劲专属优惠券"提示

## 分析

两个外部商品（359单瓶装、1159四瓶装）跳转有赞商城购买，用户到有赞后可联系客服说暗号领专属优惠券。当前详情页没有任何提示，用户不知道有这个福利，会损失转化动力。

## 方案

在详情页底部购买按钮上方，针对有 `external_url` 的商品，增加一个醒目但不突兀的"专属福利"提示卡片。

### 提示卡片设计

```text
┌─────────────────────────────────┐
│ 🎁 有劲专属福利                   │
│ 跳转有赞商城后，点击【客服】       │
│ 说暗号「有劲专属」领专属优惠券      │
│ 单瓶装立减40元 · 4瓶装立减397元   │
└─────────────────────────────────┘
│         [前往购买 ¥xxx]           │
```

- 渐变背景卡片（amber/orange 暖色调），视觉上像"福利彩蛋"
- 暗号文字加粗高亮，便于用户记忆和复制
- 仅对 `external_url` 存在的商品显示
- 根据商品价格动态展示对应优惠金额（359→立减40，1159→立减397）

### 文件变更

| 文件 | 操作 |
|---|---|
| `src/components/store/ProductDetailDialog.tsx` | 在购买按钮上方（约第224行 sticky 区域内），新增专属福利提示卡片，仅对 external_url 商品渲染 |

### 实现细节

```typescript
// 优惠券映射
const COUPON_INFO: Record<string, { discount: number; threshold: string }> = {
  '3ept17m02a8x5x3': { discount: 40, threshold: '389元单瓶可用' },
  '26x5yk7m5xg6hyx': { discount: 397, threshold: '1556元4瓶装可用' },
};

// 在 sticky 购买按钮区域内，Button 之前渲染
{product.external_url && couponInfo && (
  <div className="mb-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 px-4 py-3">
    <p className="text-sm font-semibold text-amber-800">🎁 有劲专属福利</p>
    <p className="text-xs text-amber-700 mt-1">
      跳转有赞商城后，点击<span className="font-bold">「客服」</span>，说暗号<span className="font-bold text-orange-600">「有劲专属」</span>领优惠券
    </p>
    <p className="text-xs text-amber-600 mt-0.5">立减{couponInfo.discount}元（{couponInfo.threshold}）</p>
  </div>
)}
```

小程序码弹窗（第256-270行）也同步增加该提示，确保小程序环境用户同样能看到。

