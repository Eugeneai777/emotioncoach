

## 需求概述

让有劲合伙人在自己的后台面板中，能够消耗1个体验包名额（prepurchase_count），为自己的账号激活全部4种体验包产品：
- 尝鲜会员（50点AI额度）
- 情绪健康测评
- SCL-90心理测评
- 财富卡点测评

## 实现方案

### 1. 新增后端函数：`partner-self-redeem`

创建一个新的 Edge Function，处理合伙人自用兑换逻辑。核心流程：

```text
验证用户身份
  -> 确认是活跃合伙人
  -> 检查 prepurchase_count >= 1
  -> 检查用户是否已拥有全部4种产品（防止重复兑换）
  -> 为用户创建订单/订阅记录（复用 claim-partner-entry 的授权逻辑）
  -> 扣减 prepurchase_count
  -> 返回成功结果
```

与现有 `claim-partner-entry` 的区别：
- 跳过"不能领取自己的推广福利"检查（因为这是合法的自用场景）
- 不创建 `partner_referrals` 推荐关系记录
- 不增加 `total_referrals` 计数

### 2. 新增前端组件：`PartnerSelfRedeemCard`

在合伙人面板的"推广"Tab 中添加一个"自用兑换"卡片，包含：
- 标题和说明文字："使用1个体验包名额为自己开通全部产品"
- 4种产品的权益展示列表（与 EntryTypeSelector 中的 EXPERIENCE_PACKAGES 一致）
- "立即兑换"按钮（消耗1个名额）
- 兑换成功后的状态展示
- 已兑换状态：检查用户是否已拥有这些产品，若已拥有则显示"已开通"

### 3. 修改现有文件

**`src/components/partner/YoujinPartnerDashboard.tsx`**：
- 在"推广"Tab 中引入并渲染 `PartnerSelfRedeemCard` 组件
- 传入 partner 信息

### 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `supabase/functions/partner-self-redeem/index.ts` | 新建 | 后端兑换逻辑 |
| `src/components/partner/PartnerSelfRedeemCard.tsx` | 新建 | 自用兑换UI卡片 |
| `src/components/partner/YoujinPartnerDashboard.tsx` | 修改 | 引入自用兑换卡片 |

## 技术细节

### Edge Function: `partner-self-redeem`

- 使用 service_role 客户端操作数据库（绕过 RLS）
- 通过 JWT 验证用户身份
- 授权逻辑与 `claim-partner-entry` 保持一致：
  - 尝鲜会员：创建 subscription + 增加 user_accounts quota
  - 3种测评：创建 orders 记录（amount=0, status=paid）
- 订单号前缀使用 `SELF` 以区分来源

### 前端组件

- 使用 `useAuth` 获取当前用户
- 使用 `usePartner` 获取合伙人信息
- 调用 `supabase.functions.invoke('partner-self-redeem')` 执行兑换
- 兑换前检查：通过查询 orders 表判断是否已拥有对应产品
- 兑换成功后刷新页面数据

