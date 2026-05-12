# /promo/synergy 完整套用 PromoMidlifeMen399 内容

## 目标
把 SynergyPromoPage 的所有可见内容（hero、痛点、4 大核心权益、3 大优势、教练展示、隐私承诺、见证、FAQ）**整段替换**为 PromoMidlifeMen399 的最新版本，让售前页与你之前认可的 ¥399 版完全一致。

业务逻辑（支付、兑换码、openid 轮询、已购态、跳转）**不动**。

## 章节对照（替换前 → 替换后）

| Section | 替换前（synergy 现状） | 替换后（移植 PromoMidlife） |
|---|---|---|
| 2 | 痛点入口（保留，文案一致） | 同 |
| 3 | 4 件事（团队对话/胶囊/冥想+AI/社群） | **4 件事（总教练 1V1 30min / 胶囊 / 7 天 15min 三件事 / 第 8 天总教练 1V1 45min）** |
| 4 | 每日 15–25 分钟日闭环 | **删除** |
| 5 | 知乐胶囊详解大图 | **删除**（胶囊在权益02 已讲清） |
| 6 | 总教练 + 团队 | **6 位资深教练 · 轮值带场**（采用 PromoMidlife 版） |
| 7 | 3 大核心优势 | 同结构，沿用 PromoMidlife 文案 |
| 8 | 4 条隐私承诺 | 同 |
| 9 | 见证 | 沿用 PromoMidlife 文案 |
| 10 | FAQ | 沿用 PromoMidlife 文案 |

替换后章节顺序变为：2 → 3（4 大权益）→ 4（3 大优势）→ 5（6 位教练）→ 6（隐私）→ 7（见证）→ 8（FAQ）

## 不改动（绝对不动）
- `handlePrimaryCTA` / `handleEnterCamp` / openid 轮询 / `SynergyRedeemDialog` / `alreadyPurchased` 检测
- `package_key = synergy_bundle / camp-emotion_stress_7` 业务链路
- 顶部 og/seo meta、`/promo/synergy` 路由
- Sticky 底部 CTA + 已加的"付款后顾问拉群"提示
- `CampCheckIn.tsx` / `DailyShareCard.tsx` / 数据库

## 改动清单（单文件）
**`src/pages/SynergyPromoPage.tsx`**：
1. 用 PromoMidlifeMen399 的 hero（如有差异）+ 痛点（已基本相同）保留
2. **核心权益 4 块整体替换**（200–245 行那段，含 ClipboardList/Pill/Users/Award 4 个图标，每条带完整 desc）
3. 删除 Section 4「日闭环」与 Section 5「胶囊大图详解」
4. 用 PromoMidlife 的「6 位资深教练 · 轮值带场」整段替换原 Section 6
5. Section 7（3 大优势）/ 8（隐私）/ 9（见证）/ 10（FAQ）按 PromoMidlife 版文案对齐
6. 涉及到的图标 import（如 ClipboardList、Award）补全到现有 import 行

## 验证
- `/promo/synergy` 显示与之前 PromoMidlife 同款的 4 大权益（总教练 1V1 + 胶囊 + 7天三件事 + 第8天1V1）
- 「已开通」状态下底部 CTA 仍走 `handleEnterCamp`
- 兑换码、支付、回跳轮询不受影响
