

## 有劲合伙人年费续费制

### 概述

为有劲合伙人增加年费机制：购买后有效期 1 年，到期需续费；续费时可自由选择任意等级；过期后冻结佣金权益（不产生新佣金），但保留推荐关系和已有余额；到期前自动提醒。

---

### 1. 数据库变更

**新增字段：** `partners` 表添加 `partner_expires_at` 列

| 字段 | 类型 | 说明 |
|------|------|------|
| partner_expires_at | TIMESTAMPTZ | 合伙人资格到期时间，null 表示永久（绽放合伙人） |

**数据迁移：** 将现有有劲合伙人的 `prepurchase_expires_at` 值复制到 `partner_expires_at`，确保已有数据平滑过渡。

> 注：`prepurchase_expires_at` 保留，专门用于体验包名额的有效期；`partner_expires_at` 用于合伙人资格（佣金权益）的有效期。两者分开管理。

---

### 2. 后端逻辑变更

#### 2.1 `wechat-pay-callback`（支付回调）

- **新建合伙人：** 设置 `partner_expires_at` 为当前时间 + 1 年
- **续费/升级：** 
  - 如果当前未过期：`partner_expires_at = MAX(当前到期时间, 当前时间) + 1 年`（叠加剩余天数）
  - 如果已过期：`partner_expires_at = 当前时间 + 1 年`
  - 更新 `partner_level`、`commission_rate_l1/l2`、`prepurchase_count` 为新等级对应值
  - 将 `status` 恢复为 `active`（如果之前是 expired）
- **允许降级续费：** 移除现有的升级限制逻辑，续费时可选任意等级

#### 2.2 `calculate-commission`（佣金计算）

- 在计算 L1/L2 佣金前，检查合伙人的 `partner_expires_at`
- 如果 `partner_expires_at` 不为 null 且已过期，跳过佣金计算，记录日志
- 已过期的合伙人不再产生新佣金，但已有的 pending/available 余额不受影响

#### 2.3 `create-wechat-order`（创建订单）

- 续费时传入的 `package_key` 仍为 `youjin_partner_l1/l2/l3`
- 移除"禁止降级购买"的校验，允许续费时选择任何等级

---

### 3. 前端变更

#### 3.1 `PartnerOverviewCard`（概览卡片）

- 将现有的底部小字有效期提示升级为醒目的倒计时显示
- 根据剩余天数显示不同状态：
  - 大于 30 天：正常显示到期日期（绿色）
  - 30 天内：黄色警告 "还有 X 天到期"
  - 7 天内：红色紧急 "即将到期，请尽快续费"
  - 已过期：红色 "已过期" + 续费按钮

#### 3.2 `YoujinPartnerDashboard`（合伙人面板）

- 过期状态下：顶部显示醒目的续费横幅，说明"佣金权益已冻结，续费后恢复"
- 临近过期（30天内）：显示续费提醒卡片
- 过期后仍可查看学员列表、佣金明细、提现余额，但推广功能提示"续费后可用"

#### 3.3 `YoujinPartnerIntro`（购买/续费页面）

- 已过期的合伙人：所有等级按钮显示"续费"而非"升级"
- 未过期的合伙人：允许选择任意等级（含降级），按钮显示"续费并切换等级"或"续费"
- 新增续费说明文案：说明续费后有效期延长 1 年，佣金比例按新等级生效

#### 3.4 `PartnerUpgradeCard`（升级提示卡片）

- 改为"续费/升级"卡片，临近到期时优先提示续费
- 已过期时直接显示续费引导

#### 3.5 `usePartner` Hook

- 新增 `isExpired` 计算属性：基于 `partner_expires_at` 判断是否过期
- 新增 `daysUntilExpiry` 计算属性：剩余天数
- 新增 `needsRenewalReminder`：30 天内到期返回 true

---

### 4. 文件变更总表

| 文件 | 操作 | 说明 |
|------|------|------|
| 数据库迁移 | 新增 | 添加 `partner_expires_at` 列 + 数据迁移 |
| `src/hooks/usePartner.ts` | 修改 | 新增 isExpired、daysUntilExpiry 等计算属性 |
| `src/components/partner/PartnerOverviewCard.tsx` | 修改 | 到期倒计时 + 状态颜色 + 续费按钮 |
| `src/components/partner/YoujinPartnerDashboard.tsx` | 修改 | 过期横幅 + 续费提醒 + 功能限制提示 |
| `src/components/partner/PartnerUpgradeCard.tsx` | 修改 | 改为续费/升级双功能卡片 |
| `src/pages/YoujinPartnerIntro.tsx` | 修改 | 支持续费流程 + 允许降级选择 + 续费文案 |
| `supabase/functions/wechat-pay-callback/index.ts` | 修改 | 续费逻辑：延长有效期 + 更新等级 + 恢复状态 |
| `supabase/functions/calculate-commission/index.ts` | 修改 | 佣金计算前检查合伙人是否过期 |
| `supabase/functions/create-wechat-order/index.ts` | 修改 | 移除降级购买限制 |
| `src/config/partnerLevels.ts` | 修改 | 可选：添加续费相关配置 |
| `src/pages/YoujinPartnerTerms.tsx` | 修改 | 更新条款：说明年费制和续费规则 |

---

### 5. 业务流程

```text
用户购买合伙人套餐
       |
       v
  设置 partner_expires_at = now() + 1年
  设置等级、佣金比例、预购额度
       |
       v
  正常使用合伙人功能（推广、分发、赚佣金）
       |
       v
  到期前30天 --> 面板显示续费提醒
  到期前7天  --> 红色紧急提醒
       |
       v
  [到期日]
       |
  +----+----+
  |         |
  续费      不续费
  |         |
  v         v
选择等级   佣金冻结
延长1年    推荐关系保留
更新佣金   余额可提现
恢复active  status不变(仍active)
            但佣金不再产生
```

