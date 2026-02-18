

# 让合伙人看到分成商品和比例

## 概述
在两个地方向有劲/绽放合伙人展示哪些商品参与了分成以及分成比例：
1. **合伙人中心"收益"Tab** — 新增"分成商品"卡片，列出所有参与该类型分成的商品及比例
2. **佣金明细** — 在 `CommissionHistory` 中补充 `store_product` 类型的中文显示

## 改动内容

### 1. 新建组件：`StoreCommissionProducts.tsx`
在 `src/components/partner/` 下新建组件，接收 `partnerType` 参数（`youjin` 或 `bloom`），从 `health_store_products` 表查询对应字段：
- 若 `partnerType === 'youjin'`：查询 `youjin_commission_enabled = true` 的商品，展示 `youjin_commission_rate`
- 若 `partnerType === 'bloom'`：查询 `bloom_commission_enabled = true` 的商品，展示 `bloom_commission_rate`

UI 为一个 Card，标题"分成商品"，每行显示：商品图片（小缩略图）+ 商品名称 + 分成比例（如"10%"）。无分成商品时显示空状态提示。

### 2. 修改合伙人中心页面：`Partner.tsx`
在绽放合伙人的"收益"TabsContent 中，`CommissionHistory` 组件之前插入 `StoreCommissionProducts` 组件。

对于有劲合伙人（`YoujinPartnerDashboard`），同样在收益区域插入该组件。

### 3. 修改佣金明细：`CommissionHistory.tsx`
在 `getOrderTypeName` 函数中补充 `store_product: '商城商品'` 映射，让商城佣金记录显示正确的中文名称。

---

## 技术细节

**新建文件**: `src/components/partner/StoreCommissionProducts.tsx`
- 使用 `useQuery` 查询 `health_store_products`
- 根据 `partnerType` 过滤对应的 `_commission_enabled = true`
- 卡片列表展示商品缩略图、名称、价格、分成比例

**修改文件 1**: `src/pages/Partner.tsx`
- 导入 `StoreCommissionProducts`
- 在收益 Tab 的 `CommissionHistory` 前插入 `<StoreCommissionProducts partnerType={partner.partner_type} />`

**修改文件 2**: `src/components/partner/CommissionHistory.tsx`
- 第 70-77 行 `getOrderTypeName` 中增加 `store_product: '商城商品'`

**修改文件 3**: `src/components/partner/YoujinPartnerDashboard.tsx`
- 在收益相关区域插入 `StoreCommissionProducts` 组件

