

## 修正绽放合伙人名额逻辑：从L1权益规则动态获取

### 核心问题

当前 `claim-partner-invitation` 中 `prepurchase_count: 100` 是硬编码值。正确逻辑应该是：绽放合伙人同享有劲L1权益，100名额来源于 `partner_level_rules` 表中 L1 的 `min_prepurchase` 字段。

### 需要修改的文件

#### 1. `supabase/functions/claim-partner-invitation/index.ts`
- 在创建/升级合伙人之前，先从 `partner_level_rules` 表查询有劲L1的 `min_prepurchase` 值
- 用查询结果替代硬编码的 `100`
- 升级路径（existingPartner）和新建路径都使用同一个动态值

#### 2. `supabase/functions/auto-claim-bloom-invitation/index.ts`
- 同样的逻辑：查询L1规则获取 `min_prepurchase`
- 升级路径（第60-69行）补充 `prepurchase_count` 字段
- 新建路径（第157-168行）补充 `prepurchase_count` 字段

#### 3. `src/components/partner/BloomYoujinBenefitsCard.tsx`（第51行和第61行）
- 将 `partner.prepurchase_count || 100` 改为 `partner.prepurchase_count ?? 0`
- 与 Partner.tsx 中已修复的逻辑保持一致，不再用硬编码兜底

### 技术细节

两个 Edge Function 中新增的查询逻辑：

```typescript
// 从规则表动态获取有劲L1的预购名额
const { data: l1Rule } = await adminClient
  .from('partner_level_rules')
  .select('min_prepurchase')
  .eq('partner_type', 'youjin')
  .eq('level_name', 'L1')
  .eq('is_active', true)
  .single();

const l1PrepurchaseCount = l1Rule?.min_prepurchase ?? 100; // 安全兜底
```

然后在 insert/update 中使用 `prepurchase_count: l1PrepurchaseCount`。

这样，如果将来L1名额从100调整为其他数值，绽放合伙人的名额也会自动同步。
