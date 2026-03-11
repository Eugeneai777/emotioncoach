

# 修复：已购用户进入财富训练营仍显示 ¥299 付费墙

## 问题根因

用户通过 `/promo/wealth-synergy` 购买的 packageKey 是 `wealth_synergy_bundle`，但 `CampIntro.tsx`（训练营介绍页）的购买检测有两处遗漏：

**遗漏 1**：`CampIntro.tsx` 第 87-89 行，orders 表查询只检查 `camp-wealth_block_7`，**没有包含 `wealth_synergy_bundle`**：
```typescript
// 当前逻辑（wealth_block_7 只查了 camp-wealth_block_7）
const packageKeys = ['emotion_journal_21', 'emotion_stress_7'].includes(campType!)
  ? ['synergy_bundle', `camp-${campType}`]
  : [`camp-${campType}`];  // ← 缺少 wealth_synergy_bundle
```

**遗漏 2**：`useCampPurchase.ts` 第 7-8 行，user_camp_purchases 表查询只匹配 `wealth_block_7` 和 `wealth_block_21`，**没有包含 `wealth_synergy_bundle`**。

## 修复方案

### 文件 1：`src/pages/CampIntro.tsx`（第 87-89 行）

在 orders 表查询中，为 `wealth_block_7` 增加 `wealth_synergy_bundle` 的 packageKey 映射：

```typescript
const packageKeys = ['emotion_journal_21', 'emotion_stress_7'].includes(campType!)
  ? ['synergy_bundle', `camp-${campType}`]
  : campType === 'wealth_block_7'
  ? ['wealth_synergy_bundle', `camp-${campType}`]
  : [`camp-${campType}`];
```

### 文件 2：`src/hooks/useCampPurchase.ts`（第 7-8 行）

在 user_camp_purchases 表查询的兼容映射中，增加 `wealth_synergy_bundle`：

```typescript
if (campType === 'wealth_block_7') {
  return ['wealth_block_7', 'wealth_block_21', 'wealth_synergy_bundle'];
}
```

### 文件 3：`src/hooks/useCampEntitlement.ts`（第 7-8 行）

同步修复，保持一致：

```typescript
if (campType === 'wealth_block_7') {
  return ['wealth_block_7', 'wealth_block_21', 'wealth_synergy_bundle'];
}
```

## 影响范围

这三处修复后，通过推广页购买 `wealth_synergy_bundle` 的用户在进入 `/camp-intro/wealth_block_7` 时，系统将正确识别已购状态，按钮显示"已购买，立即开始"而非"立即购买 ¥299"。

