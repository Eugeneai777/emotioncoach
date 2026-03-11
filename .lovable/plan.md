

# 知乐商品购买体验优化方案

## 问题分析

通过代码审查发现 3 个核心问题和 1 个数据流断裂：

1. **购买按钮被埋** — `ProductDetailDialog` 中"立即购买"在最底部，商品介绍+详情图长时需大量滚动
2. **配送提示不准确** — CheckoutForm 硬编码"建议收到后再开启训练营"，不适用于单独购买胶囊
3. **缺少身份证信息** — 跨境商品清关需要身份证姓名和证件号，目前无此字段
4. **数据流断裂** — 商城购买写入 `store_orders` 表，但知乐订单看板 (`ZhileOrdersDashboard`) 只读 `orders` 表，导致商城的知乐订单在后台看不到

## 修改方案

### 1. 购买按钮置底吸附 — `ProductDetailDialog.tsx`

将"立即购买"从滚动内容中提取出来，固定在弹窗底部（sticky），用户无需滚到最底部即可点击。

### 2. 配送提示动态化 — `CheckoutForm.tsx`

- 新增 `shippingNote` 可选 prop，由调用方传入（取自商品的 `shipping_info` 字段）
- 默认文案改为"预计 4-7 个工作日送达"，去掉训练营相关文字
- 当商品有 `shipping_info` 时显示该内容，否则显示默认文案

### 3. 新增身份证信息字段 — `CheckoutForm.tsx` + 数据库

- 在收货表单中新增"清关信息"区块：身份证姓名 + 身份证号码
- 新增 `needIdCard` prop（boolean），由调用方决定是否显示（非所有商品都需要）
- 身份证号做基本格式校验（18位）
- 提示文案："因海关清关需要，请填写与收件人一致的身份信息"（参考京东跨境模式，无需上传证件照）

**数据库**：`store_orders` 表新增 `id_card_name` 和 `id_card_number` 两列

**CheckoutInfo 接口扩展**：
```typescript
export interface CheckoutInfo {
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  idCardName?: string;    // 新增
  idCardNumber?: string;  // 新增
}
```

### 4. 调用方适配 — `HealthStoreGrid.tsx`

- 传入 `shippingNote` = 商品的 `shipping_info`
- 当商品 `shipping_info` 包含"跨境"或"清关"或"香港"关键字时自动启用 `needIdCard`
- 创建 `store_orders` 时写入 `id_card_name` 和 `id_card_number`

### 5. 修复数据流断裂 — `get_zhile_orders` 函数

更新数据库函数，使用 `UNION ALL` 同时查询 `orders` 和 `store_orders` 中知乐相关的订单，确保商城渠道的知乐订单也能出现在后台看板中。同时在 CSV 导出中增加"身份证姓名"和"身份证号"列。

### 6. ZhileOrdersDashboard 显示身份证信息

在订单表格中新增"身份证信息"列，方便知乐合作方在发货时提交清关资料。

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/store/ProductDetailDialog.tsx` | 购买按钮 sticky 吸底 |
| `src/components/store/CheckoutForm.tsx` | 动态配送提示 + 身份证字段 |
| `src/components/store/HealthStoreGrid.tsx` | 传入 shippingNote/needIdCard + 写入身份证 |
| `src/pages/ZhileProductsPage.tsx` | 同步适配 CheckoutForm 新 props |
| `src/components/partner/ZhileOrdersDashboard.tsx` | 显示身份证列 + CSV导出 |
| 数据库迁移 | store_orders 加列 + 更新 get_zhile_orders 函数 |

