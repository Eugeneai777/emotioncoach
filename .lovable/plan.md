

## 修正有劲小工具的分成逻辑说明

### 问题分析

目前代码中存在一个业务逻辑错误：`youjinPartnerProducts.ts` 中将 4 款 ¥9.9 小工具（尝鲜会员、情绪健康测评、SCL-90、财富卡点测评）列为"可分成产品"，但实际业务逻辑是：

**正确逻辑：**
- 小工具不参与佣金分成，而是从合伙人预购额度中扣减
- 合伙人设定"付费"（¥9.9）：用户支付的 ¥9.9 全部成为合伙人收入
- 合伙人设定"免费"：用户免费获得，合伙人无收入
- 无论免费还是付费，都消耗 1 个预购名额

### 修改内容

#### 1. 修正可分成产品列表

**文件：** `src/config/youjinPartnerProducts.ts`

从 `commissionableProducts` 中移除 4 款 ¥9.9 小工具（尝鲜会员、情绪健康测评、SCL-90、财富卡点测评），因为它们不参与佣金分成。

修改后可分成产品从 11 款变为 7 款：
- 365会员（¥365）
- 21天情绪日记训练营（¥299）
- 财富觉醒训练营（¥299）
- 21天青少年困境突破营（¥299）
- 初级合伙人（¥792）
- 高级合伙人（¥3,217）
- 钻石合伙人（¥4,950）

`totalCommissionableCount` 从 11 改为 7。

#### 2. 更新合伙人介绍页标题

**文件：** `src/pages/YoujinPartnerIntro.tsx`

- "可分成产品一览（11款）" 改为 "可分成产品一览（7款）"

#### 3. 更新合伙人方案页标题

**文件：** `src/pages/YoujinPartnerPlan.tsx`

- "可分成产品一览（11款）" 改为 "可分成产品一览（7款）"

#### 4. 优化入口设置说明

**文件：** `src/components/partner/EntryTypeSelector.tsx`

在入口方式选择卡片中，增加收益说明文案：
- **免费领取**：描述改为"扫码免费获得体验套餐，消耗1个名额，无收入"
- **付费 ¥9.9**：描述改为"支付¥9.9获得体验套餐，消耗1个名额，¥9.9归你"

在底部提示信息中增加一条说明：
- "📦 体验包从预购名额中扣减，不参与佣金分成"
- "💵 付费模式下，用户支付的¥9.9全额为你的收入"

#### 5. 更新推广指南说明

**文件：** `src/components/partner/YoujinPartnerDashboard.tsx`

在推广指南的描述文案中补充关键信息，让合伙人理解小工具的收益机制。

### 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/config/youjinPartnerProducts.ts` | 修改 | 移除4款小工具，数量改为7 |
| `src/pages/YoujinPartnerIntro.tsx` | 修改 | 标题数字11改7 |
| `src/pages/YoujinPartnerPlan.tsx` | 修改 | 标题数字11改7 |
| `src/components/partner/EntryTypeSelector.tsx` | 修改 | 增加收益说明文案 |
| `src/components/partner/YoujinPartnerDashboard.tsx` | 修改 | 更新推广指南说明 |

无需数据库变更。

### 技术细节

- `commissionableProducts` 数组删除前4项（基础产品和测评服务类），保留年度会员、训练营和合伙人套餐
- `totalCommissionableCount` 常量从 11 改为 7
- `EntryTypeSelector` 中两种入口类型的 `<p>` 描述文字更新为包含收益信息的简明文案
- 底部提示区新增两条 `<p>` 说明，使用 📦 和 💵 emoji 图标保持现有风格一致

