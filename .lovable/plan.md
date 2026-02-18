

# 商城商品分成：按合伙人类型全员分成

## 需求理解
行业合伙人上架商品时，可以选择"有劲合伙人参与分成"和/或"绽放合伙人参与分成"，并分别设置分成比例。购买成功后，**所有**该类型的活跃合伙人都自动获得佣金结算。

## 数据库变更

### 方案：直接在 `health_store_products` 表新增字段
无需新建表，在商品表上加 4 个字段即可：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `youjin_commission_enabled` | boolean | false | 是否允许有劲合伙人分成 |
| `youjin_commission_rate` | numeric | 0 | 有劲合伙人分成比例（如 0.10 = 10%） |
| `bloom_commission_enabled` | boolean | false | 是否允许绽放合伙人分成 |
| `bloom_commission_rate` | numeric | 0 | 绽放合伙人分成比例 |

这样最简单，不需要额外的关联表和 RLS 策略。

## 前端变更

### 1. 商品上架/编辑表单（PartnerStoreProducts.tsx）
在表单底部、"上架状态"开关之前，新增**分成设置**区域：

```
┌─────────────────────────────────┐
│ 💰 分成设置                       │
│                                   │
│ [开关] 有劲合伙人参与分成           │
│        分成比例：[___] %           │
│                                   │
│ [开关] 绽放合伙人参与分成           │
│        分成比例：[___] %           │
└─────────────────────────────────┘
```

- 开关关闭时隐藏比例输入框
- 表单状态（ProductForm）新增 4 个字段
- 保存时将比例值写入 `health_store_products`

### 2. 商品卡片标记
在商品列表卡片上显示分成标签，如"有劲分成 10%"、"绽放分成 15%"。

## 后端变更

### 3. 新建 Edge Function：`settle-store-commission`
购买成功后由前端 `handlePaySuccess` 调用，逻辑如下：

1. 接收 `{ order_no, product_id, order_amount, buyer_id }`
2. 使用 service_role 查询商品的分成配置
3. 如果 `youjin_commission_enabled = true`：
   - 查询所有 `partner_type = 'youjin'` 且 `is_active = true` 的合伙人
   - 为每个合伙人计算佣金 = `order_amount * youjin_commission_rate`
   - 插入 `partner_commissions` 记录（status: pending，21天后确认）
   - 调用 `add_partner_pending_balance` 更新待结算余额
4. 绽放合伙人同理
5. 已有的 `confirm-commissions` 定时函数会在 21 天后自动确认这些佣金

### 4. 修改 HealthStoreGrid.tsx
在 `handlePaySuccess` 中，创建 store_order 后调用 `settle-store-commission` 函数。

## 技术细节

### 数据库迁移 SQL
```sql
ALTER TABLE public.health_store_products
  ADD COLUMN youjin_commission_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN youjin_commission_rate numeric NOT NULL DEFAULT 0,
  ADD COLUMN bloom_commission_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN bloom_commission_rate numeric NOT NULL DEFAULT 0;
```

### Edge Function: settle-store-commission/index.ts
- 使用 service_role 客户端
- 查询商品分成配置
- 批量查询对应类型的活跃合伙人
- 为每个合伙人创建佣金记录，`order_type` 设为 `store_product`
- 调用 `add_partner_pending_balance` RPC 更新待结算余额
- 所有操作在 try/catch 中，单个合伙人失败不影响其他人

### 修改文件清单
1. **数据库迁移** - `health_store_products` 表新增 4 个分成字段
2. **修改** `src/components/partner/PartnerStoreProducts.tsx` - 表单增加分成开关和比例输入
3. **新建** `supabase/functions/settle-store-commission/index.ts` - 后端佣金结算
4. **修改** `src/components/store/HealthStoreGrid.tsx` - 支付成功后调用结算函数

