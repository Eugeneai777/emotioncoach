

# 行业合伙人管理页面优化

## 问题

当前管理后台的行业合伙人详情页（`/admin/industry-partners?partner=xxx`）中：
- **收益看板**使用的是 `PartnerStats` 组件 — 仅展示静态数字卡片，无法点击下钻查看明细
- 已实现的 `EarningsDetailDialog`（数据下钻弹窗）只接入了合伙人端的 `PartnerOverviewCard`，管理后台未接入
- **跟进提醒**的分产品规则已实现并共享，管理后台已可用（无需额外修改）

## 方案

### 修改 `PartnerStats.tsx` — 添加数据下钻能力

将 6 个静态卡片改为可点击，点击后弹出 `EarningsDetailDialog` 展示对应明细：

- **总收益** → 佣金订单明细（支持搜索、按状态筛选）
- **待确认** → 待确认佣金列表
- **可提现** → 已确认佣金列表
- **已提现** → 提现记录列表
- **直推人数** → 一级推荐用户 + 购买产品明细
- **二级人数** → 二级推荐用户 + 购买产品明细

每个卡片增加 `cursor-pointer` 和点击提示（如 "点击查看 ›"），引入 `EarningsDetailDialog` 并通过 `useState` 管理弹窗状态。

### 新增 "pending" 类型支持

当前 `EarningsDetailDialog` 的 `DetailType` 不含 "pending"（待确认）。新增 `pending` 类型，查询 `partner_commissions` 表中 `status='pending'` 的记录。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/partner/PartnerStats.tsx` | 添加点击下钻 + 引入 EarningsDetailDialog |
| `src/components/partner/EarningsDetailDialog.tsx` | 新增 `pending` DetailType |

无需数据库变更，无新组件创建。

