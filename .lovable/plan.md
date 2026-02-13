
# 行业合伙人体系重构计划

## 背景

行业合伙人与有劲/绽放合伙人在本质上不同：
- 行业合伙人是**公司/机构**，不需要关联用户账号
- 他们带入流量，可打造**自己的产品包**，有独立分成
- 他们带入的用户可以继续成为有劲或绽放合伙人

当前问题：`partners` 表的 `user_id` 字段是 `NOT NULL` 且有唯一约束（`partners_user_id_key`），导致无法创建不关联用户的行业合伙人。

## 实施步骤

### 第一步：数据库迁移

1. **`user_id` 改为可选** — 行业合伙人不需要用户账号
2. **唯一约束调整** — 将 `partners_user_id_key` 替换为部分唯一索引（仅对非空 `user_id` 生效）
3. **外键约束调整** — 移除现有外键，重新添加允许 NULL 的外键
4. **新增行业合伙人专属字段**：
   - `custom_product_packages` (JSONB) — 自定义产品包配置
   - `traffic_source` (TEXT) — 流量来源描述
   - `settlement_cycle` (TEXT) — 结算周期（月结/季结等）

```text
迁移 SQL 概要:
- ALTER TABLE partners ALTER COLUMN user_id DROP NOT NULL
- DROP CONSTRAINT partners_user_id_key
- CREATE UNIQUE INDEX partners_user_id_unique ON partners(user_id) WHERE user_id IS NOT NULL
- 新增 custom_product_packages, traffic_source, settlement_cycle 字段
```

### 第二步：前端创建逻辑修改

修改 `IndustryPartnerManagement.tsx`：
- 创建行业合伙人时 **不传 `user_id`**（设为 NULL）
- 新增产品包配置表单（可选）
- 新增流量来源、结算周期字段
- 移除获取当前管理员 ID 作为 `user_id` 的逻辑

### 第三步：行业合伙人归因机制

行业合伙人的推广码（IND-XXXXXX）工作方式：
- 用户通过行业合伙人的推广链接进入平台
- 在 `partner_referrals` 表中记录归因关系
- 这些用户后续可以独立成为有劲或绽放合伙人
- 行业合伙人从其带入用户的消费中获得分成

### 技术细节

| 改动项 | 文件/位置 | 说明 |
|--------|-----------|------|
| 数据库迁移 | partners 表 | user_id 可选、唯一索引调整、新增字段 |
| 创建逻辑 | IndustryPartnerManagement.tsx | user_id 设为 null，新增表单字段 |
| 类型定义 | IndustryPartner 接口 | user_id 改为可选，新增字段类型 |
| RLS 策略 | partners 表 | 确保 admin 可操作 user_id 为 null 的记录 |

### 注意事项

- 现有的有劲/绽放合伙人数据不受影响（它们的 `user_id` 不为空，部分唯一索引照常生效）
- `process-referral` 边缘函数需要适配行业合伙人（`user_id` 可能为 null 时的防自推荐逻辑）
- 佣金结算流程中，行业合伙人的佣金直接按 `custom_commission_rate_l1` 计算，无二级佣金
