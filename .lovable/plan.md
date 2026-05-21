## 目标

把 `/promo/midlife-women-399` 对标男版 `/promo/synergy` 改造：女性化命名 + 同权益（含知乐胶囊）+ 兑换码闭环（核对逻辑与男版一致）。MVP 阶段：不新增表、不改后端、不改 edge function，运营导入兑换码即可工作。

---

## 1. 命名（最终）

**页面主标题：「7 天身心舒展营」**

- HERO H1：`7 天身心舒展营`
- HERO 副标：`35+ 女性的身心舒展计划 · 没人会知道你来过`
- Eyebrow：`FOR HER 35+ · 7 DAYS`
- 顶部 chip：`施强健康 ✕ 有劲AI · 含知乐胶囊实物`
- `<title>`：`7 天女性身心舒展营 · 35+ 女性的身心舒展计划 ｜ 含知乐胶囊`
- meta description：`35+ 女性的 7 天身心舒展计划。海沃塔团队对话 + 知乐胶囊实物 + AI 教练 + 私密女性社群。施强健康 ✕ 有劲AI 联合出品。`

---

## 2. 4 项权益（对齐男版，35+ 女性语气重写，隐私感强化）


| #   | 权益               | 女性版文案                                                                                                                       |
| --- | ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 01  | 状态梳理 + 30 分钟 1V1 | **一次"她状态"梳理 + 资深女教练 30 分钟 1 对 1**：把这一年身体、情绪、关系、自我哪一格在掉电，一项一项摆出来。腾讯会议 1 对 1，结束后**把录屏 + AI 纪要发到你手机里，温故而知新**——只发你本人，不进社群、不留平台。 |
| 02  | 1 瓶知乐胶囊          | **1 瓶知乐胶囊 · 顺丰匿名到家**：GABA + L-茶氨酸 + 酸枣仁 + 镁。白天稳情绪、夜里沉得下睡眠。0 褪黑素、不依赖。外箱不写「情绪」「女性」任何字眼，家里 / 公婆 / 孩子都看不出是什么。下单后 48h 内寄出。       |
| 03  | 7 天每天 15 分钟      | **7 天每天 15 分钟 · 孩子睡了就能做**：5 分钟真人静心冥想（哄睡 / 通勤 / 午休随时听）+ 和 AI 情绪教练四步对话 + 3 分钟自我书写。AI 女性教练 24 小时在线，深夜也接，不留浏览记录。                |
| 04  | 第 8 天 45 分钟复盘    | **第 8 天 · 资深教练再陪你坐 45 分钟**：教练式对话，结合你 7 天写下的话，一起看接下来这半年最想先动的那一件事。**会议结束后录屏 + AI 纪要发你手机**，存着以后慢慢回看，平台不留底。                     |


视觉沿用：`coach-daixi.jpg`（权益 01 卡内嵌教练介绍）、`zhile-capsules.jpeg`（权益 02 卡产品图）+ 男版同款"实物由有劲生活馆统一发货 · 匿名包邮 · 48h 内寄出"提示条（玫瑰色调）。

替换：删除当前女版的"打卡训练营 / 课程推荐 / 海沃塔团队"4 卡。
微调：3 大优势的"高性价比"那条加 `含 1 瓶知乐胶囊（价值 ¥389）`；FAQ 新增 1 条"胶囊怎么发？家人会不会看见？"。

---

## 3. 价格

保持 `¥399`，原价 `¥688` 不变。底部 sticky CTA：未购 `¥399 · 立即加入 · 含知乐胶囊`，已购 `已购买，开始训练`。

---

## 4. 兑换码闭环（与男版逻辑 100% 对齐）

**关键改动**：去掉当前的 `UnifiedPayDialog` 站内 ¥399 支付路径，改为 = 男版流程：

1. 点击 CTA → 检查登录。未登录：`setPostAuthRedirect(RETURN_URL)` → `/auth`。
2. 已登录 → 检查 `orders`（`package_key in ['synergy_bundle','camp-emotion_stress_7']` + `status='paid'`）+ `user_camp_purchases`（`camp_type in ['emotion_stress_7','synergy_bundle']` + `payment_status='completed'`）。
3. 已购 → `autoCreateAndEnterCamp()`（复用男版逻辑，camp_type=`emotion_stress_7`，进入 `/camp-checkin/:id`）。
4. 未购 → 弹 `SynergyRedeemDialog`（复用男版组件）。
5. 兑换码校验仍走现有 `redeem-synergy-code` edge function（**与男版完全同一个**）→ 成功后开通 `emotion_stress_7` 权益 + 弹 `SuccessPanel` → "进入有劲训练营"。

**SynergyRedeemDialog 最小改造**（仅为支持女性版有赞链接，不影响男版）：

- 把 `YOUZAN_URL` 改为支持 prop 覆盖：新增可选 prop `youzanUrl?: string`，默认值保留现有男版常量。
- 女版页面传入女性 SKU 链接：
`https://tuicashier.youzan.com/pay/wscgoods_order?banner_id=uc.129613790~recService.1~3~feGjbidV&alg=...&alias=3nfyjsg6yhbbdas`
- 小程序码：**MVP 沿用现有 `youzan-miniprogram-qr.png**`（不改）。
- 弹窗标题/文案保持中性"兑换训练营"，不区分男女，男版无感知。

**运营侧**（你来做）：在 `synergy_activation_codes` 表导入女性 SKU 的兑换码批次。后端校验完全复用现有逻辑，码无男女之分，扫码→下单→拿到码→回页面输入→开通 `emotion_stress_7`，跟男版核对路径 100% 一致。

---

## 5. 移除/清理

- 删除 `usePaymentCallback` import 与回调、`UnifiedPayDialog` import 与 state、`useWechatOpenId`（兑换码流程不再需要站内支付）。
- 保留 `usePackagePurchased` 作为辅助已购判定；新增从男版抄过来的 `checkPurchase` + `autoCreateAndEnterCamp` 逻辑（直接内联，不抽 hook）。
- 保留教练团、信任保障、同龄证言区块（女性版本独有的优势，不动）。

---

## 6. 改动文件清单

- `src/pages/PromoMidlife25to45Women399.tsx`：HERO 命名、4 项权益替换、FAQ 增 1 条、CTA 接入 `SynergyRedeemDialog` + `SuccessPanel`（复用男版样式，玫瑰色调适配）、清理无用 import。
- `src/components/promo/SynergyRedeemDialog.tsx`：新增 `youzanUrl?: string` 可选 prop（默认值=现常量），其余不动。
- 不新增表、不改 edge function、不改路由、不改 `redeem-synergy-code`。

---

## 7. 确认事项

1. 主标题确认就用「7 天身心舒展营」？
2. 兑换码导入：你这边在 `synergy_activation_codes` 表导入女性 SKU 那批码，按男版逻辑跑通即可（无需后端额外区分）。
3. 复用现有男版 `SuccessPanel`（暗金风）还是另做一个玫瑰色版？MVP 建议**直接复用男版**（最快上线），后续如果需要再做女性配色版。