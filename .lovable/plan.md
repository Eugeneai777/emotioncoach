

# 将售价 ¥389 改为 ¥399

## 改动文件

### 1. `src/pages/ZhileCoachPromoPage.tsx`
将所有 `389` 价格显示改为 `399`（约 4 处）：
- L265: Hero 区 `¥389` → `¥399`
- L575: 价格区 `¥389` → `¥399`
- L640: 吸底栏 `¥389` → `¥399`
- L675: shareTitle `¥389` → `¥399`

注意：L117 的 `zhile_coach_389` 是 package_key 标识符，不改。

### 2. `src/components/promo/ZhileCoachShareCard.tsx`
- L19: footerConfig ctaSubtitle `¥389` → `¥399`
- L53: 标题 `¥389` → `¥399`

