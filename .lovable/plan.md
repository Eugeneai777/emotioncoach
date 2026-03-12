
目标：一次性解决你反馈的两个核心问题（“发布站点无横向滚动条”“下单后清关信息仍为空”），并确保同类问题不再复发。

一、已确认的根因（基于代码+数据库+日志）
1) 清关信息未同步：
- 数据库里最新订单（如 `YJ20260312090252514W2G`）`id_card_name/id_card_number` 仍为 `NULL`。
- 支付函数日志显示订单创建时只有 `hasBuyerInfo`，未体现身份证字段，说明发布站点实际请求未稳定传入身份证参数。
- 当前不同入口对清关信息采集不一致（如协同套餐页 `CheckoutForm` 未强制 `needIdCard`），导致“有入口能填、有入口不强制/不透传”。

2) 横向滚动条“看不到”：
- 当前表格容器是双层滚动结构，且 `maxHeight:70vh` 偏高，滚动条常落在首屏以下。
- 用户在正常屏幕下会看到列被截断，但横向条不在当前可视区域，体验等同“没有滚动条”。

二、实施方案（本次将按这三组一起修）
A. 清关信息链路加固（前后端双保险）
- 统一所有知乐相关下单入口强制采集清关信息（`needIdCard=true`），尤其补齐 `SynergyPromoPage`、`WealthSynergyPromoPage`。
- 支付创建函数（微信/支付宝）改为“多形态兼容解析”身份证字段（兼容 `idCardName` / `id_card_name` / `shippingInfo.*`），避免发布站点旧请求格式导致丢字段。
- 对知乐相关 package_key 增加服务端必填校验：缺身份证直接拒单（防止再产生空清关新订单）。
- 在函数日志新增 `hasIdCard` 诊断字段，便于后续快速定位。
- 保留并强化支付成功后的 `update-order-shipping` 回写兜底（同样兼容多字段命名）。

B. 看板横向滚动“强可见”改造（仅改知乐看板）
- 改为单一滚动容器：`overflow-x-scroll + overflow-y-auto`，去掉双层滚动。
- 下调表格高度到更易首屏可见（如 `max-h-[52vh]`），并加 `scrollbar-gutter: stable both-edges`，确保始终预留滚动条槽位。
- 保持 `min-width` 强制溢出（>1900px）+ 各列 `whitespace-nowrap/min-width`，保证右侧物流列可达。
- 增加“左右滚动”按钮（程序化滚动）作为滚动条不可见时的备用操作，避免再次卡住运营。

C. 长字段可读性
- 商品名、地址维持省略显示，同时支持点击弹出完整内容（Popover），便于运营核对。

三、验收与发布（重点覆盖你当前“已发布站点”）
1) 在已发布站点分别从健康商城、协同套餐页、其他入口各下1单（填写身份证）。
2) 验证 `orders` 新订单 `id_card_name/id_card_number` 均非空，并在知乐看板一一对应展示。
3) 在 1366/1536/1920、Chrome/Edge 100% 缩放下，首屏可直接看到或立即操作横向滚动（含右侧物流列）。
4) 仅改知乐订单链路与知乐看板，不影响其他后台模块布局。

技术细节（实现时会具体落地）
- 主要文件：`create-wechat-order`、`create-alipay-order`、`update-order-shipping`、`SynergyPromoPage`、`WealthSynergyPromoPage`、`ZhileOrdersDashboard`。
- 数据结构不新增字段（已具备 `id_card_name/id_card_number`），重点做“采集一致性 + 传参兼容 + 服务端必填校验 + UI滚动容器重构”。
