

## 让绽放合伙人拥有有劲合伙人初级身份和权益

### 当前系统架构分析

#### 合伙人数据结构（partners 表）
| 字段 | 说明 |
|:-----|:-----|
| `partner_type` | 合伙人类型：`youjin` 或 `bloom` |
| `partner_level` | 等级：绽放是 `L0`，有劲是 `L1/L2/L3` |
| `commission_rate_l1` | 一级佣金率 |
| `commission_rate_l2` | 二级佣金率 |
| `prepurchase_count` | 体验包配额（仅有劲合伙人使用） |

#### 当前佣金计算逻辑（`calculate-commission/index.ts`）
```javascript
// 产品线匹配检查
if (partner.partner_type === productLine) {
  // 只有产品线匹配才计算佣金
}
```
**问题**：绽放合伙人（`bloom`）无法获得有劲产品（`youjin`）的佣金。

#### 当前 UI 展示逻辑（`Partner.tsx`）
```javascript
{partner.partner_type === 'youjin' ? (
  <YoujinPartnerDashboard partner={partner} />  // 有劲面板
) : (
  <BloomPartnerDashboard ... />  // 绽放面板
)}
```
**问题**：绽放合伙人看不到有劲合伙人的推广工具和入口类型设置。

---

### 方案选择

#### 方案 A：数据库层面 - 给绽放合伙人额外创建有劲身份（推荐）
- 绽放合伙人购买后，自动为其创建一条 `partner_type = 'youjin', partner_level = 'L1'` 的记录
- **优点**：权限完全隔离，佣金计算逻辑无需修改
- **缺点**：一个用户有两条合伙人记录，需要修改 `usePartner` hook 支持多身份

#### 方案 B：业务逻辑层面 - 扩展绽放合伙人权益（推荐）
- 在佣金计算和 UI 展示时，检测绽放合伙人并赋予有劲 L1 权益
- **优点**：不改变数据结构，逻辑集中
- **缺点**：需要修改多处代码

#### 方案 C：配置层面 - 绽放合伙人改为"复合型"
- 将绽放合伙人的 `partner_type` 改为支持多产品线
- **优点**：最灵活
- **缺点**：影响范围大，改动复杂

**推荐：方案 B** - 最小改动原则，在关键节点检测绽放身份并授予有劲 L1 权益。

---

### 实施方案（方案 B）

#### 1. 佣金计算扩展（后端）

**文件**：`supabase/functions/calculate-commission/index.ts`

**改动**：当合伙人是绽放类型时，额外检查是否应获得有劲产品佣金

```typescript
// 新增：检查绽放合伙人是否应获得有劲产品佣金
function shouldBloomGetYoujinCommission(partner: any, productLine: string): boolean {
  // 绽放合伙人可以获得有劲产品的 L1 佣金
  return partner.partner_type === 'bloom' && productLine === 'youjin';
}

// 在 L1 佣金计算部分
if (partner.partner_type === productLine || shouldBloomGetYoujinCommission(partner, productLine)) {
  // 绽放合伙人使用有劲 L1 的佣金率
  const effectiveL1Rate = partner.partner_type === 'bloom' ? 0.18 : rates.l1;
  const effectiveL2Rate = partner.partner_type === 'bloom' ? 0 : rates.l2;
  // ... 计算佣金
}
```

#### 2. UI 展示扩展（前端）

**文件**：`src/pages/Partner.tsx`

**改动**：绽放合伙人同时显示有劲推广工具

```tsx
{isPartner && partner && (
  <>
    {partner.partner_type === 'youjin' ? (
      <YoujinPartnerDashboard partner={partner} />
    ) : (
      <>
        {/* 绽放合伙人原有面板 */}
        <PartnerStats partner={partner} />
        {/* ... */}
        
        {/* 新增：有劲推广权益区块 */}
        <BloomYoujinBenefitsCard partner={partner} />
      </>
    )}
  </>
)}
```

#### 3. 新增：绽放合伙人的有劲权益卡片

**新文件**：`src/components/partner/BloomYoujinBenefitsCard.tsx`

展示内容：
- 有劲初级合伙人身份标识（💪 初级合伙人）
- 有劲产品 18% 佣金说明
- 有劲推广二维码生成入口
- 100 份体验包配额（如果绽放合伙人也给配额）

#### 4. 体验包配额处理

**选项 A**：绽放合伙人自动获得 100 份有劲体验包配额
- 在购买绽放合伙人时，设置 `prepurchase_count = 100`

**选项 B**：绽放合伙人不获得体验包，只有推广佣金
- 只需修改佣金计算，不设置 `prepurchase_count`

#### 5. 入口类型设置共享

**文件**：`src/components/partner/EntryTypeSelector.tsx`

**改动**：允许绽放合伙人设置有劲产品入口类型

---

### 涉及文件清单

| 文件 | 修改内容 |
|:-----|:---------|
| `supabase/functions/calculate-commission/index.ts` | 绽放合伙人获得有劲 L1 佣金 |
| `src/pages/Partner.tsx` | 绽放合伙人显示有劲推广区块 |
| `src/components/partner/BloomYoujinBenefitsCard.tsx` | 新建：有劲权益展示卡片 |
| `supabase/functions/wechat-pay-callback/index.ts` | 可选：购买绽放时设置体验包配额 |
| `src/components/partner/EntryTypeSelector.tsx` | 可选：允许绽放合伙人设置入口 |

---

### 关键业务规则确认

在实施前，请确认以下业务规则：

1. **佣金比例**：绽放合伙人推广有劲产品时，使用 18%（L1）佣金率还是其他比例？
2. **二级佣金**：绽放合伙人推广有劲产品是否享有二级佣金？（L1 默认无二级佣金）
3. **体验包配额**：绽放合伙人是否获得 100 份有劲体验包分发权？
4. **入口类型**：绽放合伙人是否可以设置有劲产品的入口类型（免费/付费）？
5. **升级路径**：绽放合伙人是否可以升级到有劲 L2/L3？如果可以，价格如何计算？

---

### 预期效果

1. **绽放合伙人购买后**：
   - 保留绽放产品 30%+10% 佣金
   - 额外获得有劲产品 18% 佣金（L1 权益）
   - 可选获得 100 份体验包配额

2. **合伙人中心展示**：
   - 显示绽放合伙人原有面板
   - 新增"有劲推广"区块，提供有劲产品推广工具

3. **佣金结算**：
   - 绽放产品订单 → 使用绽放佣金率
   - 有劲产品订单 → 使用有劲 L1 佣金率

