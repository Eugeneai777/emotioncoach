
目标：一次性修复 3 个问题（清关信息同步、水平滚动、长字段查看），且只改知乐订单链路，不影响其他模块布局。

一、已定位到的根因（基于当前线上数据与代码）
1) 清关信息一直为空的根因
- `get_zhile_orders()` 对 `orders` 来源硬编码返回 `NULL::text as id_card_name/id_card_number`。
- `orders` 表当前没有 `id_card_name/id_card_number` 字段，无法存储。
- 支付链路里（微信/支付宝/统一支付）`ShippingInfo` 只传姓名电话地址，身份证字段在前端被丢失。
- `update-order-shipping` 与 `claim-guest-order` 也只写姓名电话地址，不写清关信息。
- 已核验线上：知乐看板 29 条均来自 `orders`，`with_customs=0`。

2) 水平滚动和末列显示不完整
- 表格 `min-w-[1200px]` 在当前宽屏下不一定触发横向溢出，且多列未强制不换行，导致“清关信息”列被挤压成竖排、末列显示不全。

3) 商品名称长文本可读性差
- 当前是 `truncate`，没有点击查看完整内容的交互。

二、实施方案（按优先级）
A. 后端数据链路修复（核心）
1) 数据结构
- 给 `public.orders` 新增：
  - `id_card_name text`
  - `id_card_number text`
- 更新 `public.get_zhile_orders()`：
  - `orders` 分支改为返回 `o.id_card_name, o.id_card_number`（不再返回 NULL）。
  - 同时兼容 `zhile_capsule` 与现有知乐相关 key（避免漏单）。

2) 支付创建链路（全端统一）
- `create-wechat-order`、`create-alipay-order` 增加可选入参：
  - `idCardName`, `idCardNumber`
- 创建 `orders` 时直接落库这两个字段（这样即使回调页刷新也不会丢）。
- 保持现有支付逻辑不改，确保不影响微信H5/JSAPI/小程序/PC。

3) 补写链路兜底
- `update-order-shipping` 支持可选写入 `idCardName/idCardNumber`。
- `claim-guest-order` 认领游客订单时，同时支持补写身份证信息。

B. 前端参数透传修复（确保“填了就一定带到后端”）
1) 扩展支付参数类型
- 扩展 `UnifiedPayDialog / WechatPayDialog / AlipayPayDialog` 的 `shippingInfo` 类型，加入可选 `idCardName/idCardNumber`。

2) 全入口补齐透传
- `ZhileProductsPage`：
  - 把 `checkoutInfo`（含身份证）传给 `UnifiedPayDialog`。
  - 支付成功后调用 `update-order-shipping` 时也传身份证。
- `HealthStoreGrid`：
  - 传 `pendingCheckoutInfo` 的身份证给 `UnifiedPayDialog` 与 `update-order-shipping`。
- `SynergyPromoPage`、`WealthSynergyPromoPage`：
  - 支付组件与 `update-order-shipping` 一并支持身份证字段透传（即便当前可选，也不再丢）。

C. 数据看板可用性修复（不影响其他页面）
1) 仅改 `ZhileOrdersDashboard` 的表格容器与列宽策略
- 提升表格最小宽度（例如 1600+）。
- 关键列加 `whitespace-nowrap + min-w`，避免列头竖排和末列截断。
- 保持当前页面布局与卡片结构不变，只在表格区域触发横向滚动。

2) 长字段可点击查看完整
- 商品名称保留省略显示。
- 增加点击查看完整内容（Popover/Dialog 其一），支持内部人员快速核对全名。

D. 存量29笔数据处理（现实约束）
- 历史订单当前确实未存身份证，无法“自动还原”。
- 我会在看板加“清关信息补录”能力（仅管理员角色可编辑），用于把这 29 笔补齐，后续新单将自动同步不再缺失。

三、改动范围（精确到模块）
- 数据库迁移：`orders` 新增字段 + `get_zhile_orders` 重建。
- 边缘函数：
  - `supabase/functions/create-wechat-order/index.ts`
  - `supabase/functions/create-alipay-order/index.ts`
  - `supabase/functions/update-order-shipping/index.ts`
  - `supabase/functions/claim-guest-order/index.ts`
- 前端：
  - `src/components/UnifiedPayDialog.tsx`
  - `src/components/WechatPayDialog.tsx`
  - `src/components/AlipayPayDialog.tsx`
  - `src/pages/ZhileProductsPage.tsx`
  - `src/components/store/HealthStoreGrid.tsx`
  - `src/pages/SynergyPromoPage.tsx`
  - `src/pages/WealthSynergyPromoPage.tsx`
  - `src/components/partner/ZhileOrdersDashboard.tsx`

四、验收标准（上线前）
1) 任一端（微信内、微信外手机浏览器、PC、微信小程序）购买知乐相关商品并填写清关信息后：
- `orders` 中对应订单有 `id_card_name/id_card_number`。
- `get_zhile_orders()` 返回同一笔的清关字段非空。
- 看板“清关信息”列一一对应显示。

2) 看板表格
- 能横向滚动看到最右侧“物流状态/快递单号”。
- “清关信息”列不再竖排挤压。

3) 长文本
- 商品名默认省略，点击后可完整查看。

五、风险控制
- 所有改动限定在知乐订单链路与知乐看板，不触碰其他管理模块布局。
- 支付核心流程仅做“新增可选字段透传”，不改现有支付通道判断逻辑。
