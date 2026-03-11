

# 修复推广页：收货信息同步 + 购后导航 + 教练权威一致性

## 问题清单

| # | 问题 | 影响 |
|---|------|------|
| 1 | 两个推广页 `UnifiedPayDialog` 均未传 `shippingInfo` prop | 收货信息无法写入订单 → 后台看板看不到物流 |
| 2 | WealthSynergyPromoPage `handleEnterCamp` fallback 导航到 `/coach/wealth_coach_4_questions` | 用户购买后点"进入训练营"看到的是截图中的教练页，不是训练营 |
| 3 | WealthSynergyPromoPage 缺少"专业教练团队"板块 | 与 SynergyPromoPage 不一致，缺海沃塔亮点 |
| 4 | WealthSynergyPromoPage 已购检测只查 `orders` 表 | 通过其他路径购买的用户无法识别为已购 |

## 修改方案

### 文件 1：`src/pages/WealthSynergyPromoPage.tsx`

**A. 传递 shippingInfo（第 714-720 行）**
```tsx
<UnifiedPayDialog
  ...
  shippingInfo={checkoutInfo ? {
    buyerName: checkoutInfo.buyerName,
    buyerPhone: checkoutInfo.buyerPhone,
    buyerAddress: checkoutInfo.buyerAddress,
  } : undefined}
/>
```

**B. 修复 handleEnterCamp fallback（第 306 行）**
```
navigate('/coach/wealth_coach_4_questions')
→ navigate('/camp-intro/wealth_block_7')
```

**C. 新增"专业教练团队"板块**
在协同数据板块之前（约第 516 行），插入与 SynergyPromoPage 完全一致的三项内容（国际认证资质、海沃塔对话体系、已服务 2000+ 学员），配色调整为 amber/gold 主题。

**D. 补全已购检测（第 202-218 行）**
增加查询 `user_camp_purchases` 表（camp_type in `['wealth_block_7', 'wealth_synergy_bundle']`），与 SynergyPromoPage 逻辑对齐。

### 文件 2：`src/pages/SynergyPromoPage.tsx`

**A. 传递 shippingInfo（第 852-858 行）**
同上，补充 `shippingInfo` prop。

## 验证点

- 购买成功后，`orders` 表中 `buyer_name/buyer_phone/buyer_address` 有值
- 后台知乐飞轮数据看板能看到收货信息
- 购买后点"进入训练营"→ 进入 `/camp-intro/wealth_block_7`（不是教练页）
- 两个推广页都有"专业教练团队"和"海沃塔对话体系"板块

