

## 行业合伙人分成接入方案

### 问题

`calculate-commission` 边缘函数通过 `partner_type === productLine` 过滤合伙人，而 `productLine` 只返回 `youjin` 或 `bloom`，导致 `partner_type = 'industry'` 的行业合伙人**永远不会获得佣金**，即使用户通过其推广链接进入并产生了后续购买。

### 方案

修改 `calculate-commission/index.ts`，在 L1 和 L2 佣金计算中增加对 `industry` 类型合伙人的支持：

- **匹配规则**：行业合伙人推广的是有劲产品线，因此当 `partner_type === 'industry'` 且 `productLine === 'youjin'` 时，应参与分成
- **佣金率来源**：行业合伙人使用自身记录上的 `commission_rate_l1` / `commission_rate_l2`（由管理员在详情页设置），不走 `partner_level_rules` 表
- **过期检查**：复用现有的 `partner_expires_at` 过期校验逻辑

### 具体改动

**文件：`supabase/functions/calculate-commission/index.ts`**

1. L1 佣金部分（约 line 111-114），在现有的 `isMatchingProductLine` 和 `isBloomPromotingYoujin` 条件之后，新增：
   ```
   const isIndustryPartner = partner.partner_type === 'industry' && productLine === 'youjin';
   ```
   将 `if (isMatchingProductLine || isBloomPromotingYoujin)` 改为 `if (isMatchingProductLine || isBloomPromotingYoujin || isIndustryPartner)`

2. 在分支内部，增加 `isIndustryPartner` 的处理逻辑：直接读取 `partner.commission_rate_l1` 计算佣金，类似现有的"无等级规则"回退路径

3. L2 佣金部分（约 line 252），在 `partner_type === productLine` 条件中增加 `|| partner.partner_type === 'industry'`，同样使用 `partner.commission_rate_l2`

改动约 20 行代码，仅涉及一个文件。

