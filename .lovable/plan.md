
# 将安安账号A权益复制到账号B

## 现状确认

| | 账号A（微信登录） | 账号B（手机号登录） |
|---|---|---|
| **User ID** | `05c77e39-f142-4b4d-abfe-aef9cefc09c9` | `53916953-7f3e-4400-8b59-d64ed790f2a6` |
| **昵称** | Angela安安 | 安安 |
| **手机号** | 无 | 13528467591 |
| **合伙人** | 绽放合伙人 (active) | 无 |
| **测评订单** | 已开通 (paid) | 无 |
| **训练营** | 7天财富突破 | 无 |
| **交付记录** | bloom_partner_orders 存在 | 无 |

## 操作计划

为账号B（`53916953-...`）插入以下 4 条记录，复制账号A的权益：

### 1. 创建合伙人身份（partners 表）
- partner_type: bloom
- partner_level: L0
- status: active
- partner_code: 自动生成新编码
- prepurchase_count: 100
- commission_rate_l1: 0.30, commission_rate_l2: 0.10
- 其他配置与账号A一致

### 2. 创建测评订单（orders 表）
- package_key: wealth_block_assessment
- package_name: 财富卡点测评（绽放合伙人权益）
- amount: 0, status: paid
- order_type: partner_benefit

### 3. 创建训练营购买记录（user_camp_purchases 表）
- camp_type: wealth_block_7
- camp_name: 7天财富突破训练营
- payment_method: partner_benefit
- payment_status: completed
- purchase_price: 0

### 4. 创建交付跟踪记录（bloom_partner_orders 表）
- 关联新创建的 partner_id
- order_amount: 19800
- delivery_status: pending

账号A数据保持不变，两个账号将独立拥有相同权益。不涉及任何代码修改。
