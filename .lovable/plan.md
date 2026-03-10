

# 将知乐推广页面集成到行业合伙人飞轮

## 思路

在行业合伙人面板的"营销获客"分组中新增一个 Tab —— "推广页面"，直接内嵌 `/zhile-promo` 页面的卡片列表内容（复用 `promoCards` 数据），让合伙人无需离开后台即可查看和跳转所有推广页。

## 方案

1. **提取推广卡片数据为独立模块** — 将 `ZhilePromoHub.tsx` 中的 `promoCards` 数据和卡片渲染逻辑提取为一个可复用组件 `PartnerPromoPages`，接收 `partnerCode` 参数以便自动为链接追加 `?ref=` 归因参数。

2. **在 IndustryPartnerDashboard 中新增 Tab** — 在"营销获客"分组中添加 `{ value: "promo-pages", label: "推广页面" }` Tab，渲染 `PartnerPromoPages` 组件。

3. **组件功能**：
   - 展示所有推广页卡片（与 `/zhile-promo` 保持一致）
   - 每个卡片支持"复制推广链接"（自动带 `?ref=partnerCode`）和"打开页面"
   - 轻量级设计，适配后台浅色主题

### 文件变更

| 文件 | 操作 |
|------|------|
| `src/components/partner/PartnerPromoPages.tsx` | 新建 — 推广页面卡片列表组件 |
| `src/components/partner/IndustryPartnerDashboard.tsx` | 新增 Tab 和 TabsContent |

