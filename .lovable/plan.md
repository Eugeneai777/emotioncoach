# 统一售前页入口：/promo/midlife-men-399 → /promo/synergy

## 目标
彻底下线 `PromoMidlifeMen399.tsx` 这个"备用售前页"，所有 7 天有劲训练营 (¥399) 的售前流量统一到 `SynergyPromoPage.tsx`，避免再出现"改错文件、预览看不到变化"的问题。

## 现状
- `/promo/synergy` → `SynergyPromoPage.tsx`（**正式售前页**，1266 行，截图中"4 件事，按男人最在意的顺序排"就是它，文案已是最新版）
- `/promo/midlife-men-399` → `PromoMidlifeMen399.tsx`（早期版本，667 行，被错误当成主页面修改）
- 两者 package_key 都是 `synergy_bundle` / `camp-emotion_stress_7`，业务上等价

## 改动清单

### 1. `src/App.tsx`
把 `/promo/midlife-men-399` 路由从指向 `PromoMidlifeMen399` 改为 `<Navigate>` 重定向：

```tsx
<Route 
  path="/promo/midlife-men-399" 
  element={<Navigate to={`/promo/synergy${window.location.search}`} replace />} 
/>
```

保留 query string（`?ref=xxx&source=xxx` 等推广参数不能丢）。

### 2. `src/pages/PromoMidlifeMen399.tsx`
**删除该文件**。同时全局搜索并清理对它的 import / 跳转引用（如有）。

### 3. 全局引用核查
搜索以下字符串并修正：
- `PromoMidlifeMen399`（import）
- `/promo/midlife-men-399`（navigate / Link / 后端配置 / 海报二维码）

如发现数据库表 `partner_links`、海报图、微信菜单等存有旧 URL，仅在前端层做兼容（路由层重定向已覆盖），不动数据。

## 不改动
- `SynergyPromoPage.tsx` 本身的文案、权益结构、价格 — 截图显示已是最新版。
- `CampCheckIn.tsx` 三档卡片 (Tier 1/2/3) 逻辑 — 已实施，无需变动。
- `DailyShareCard.tsx` — 不动。
- 数据库、订单、套餐 key、支付链路 — 不动。

## 验证
1. 访问 `/promo/midlife-men-399?ref=share` → 自动跳到 `/promo/synergy?ref=share`，参数保留。
2. `/promo/synergy` 正常显示。
3. 构建无 import 残留报错。
