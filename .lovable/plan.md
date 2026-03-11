

# 修复：synergy_bundle 购买后 emotion_stress_7 仍显示需付费

## 问题根因

用户通过「协同抗压套餐」(`synergy_bundle`) 购买，但进入 `/camp-intro/emotion_stress_7` 时，系统不认为已购买，因为：

1. **CampIntro.tsx L87-89** — orders 表查询只把 `synergy_bundle` 映射给 `emotion_journal_21`，没有映射给 `emotion_stress_7`
2. **useCampPurchase.ts** — `getCompatibleCampTypes` 没有 `emotion_stress_7` → `synergy_bundle` 的映射
3. **useCampEntitlement.ts** — 同样缺少映射

## 修改方案

### 1. `src/pages/CampIntro.tsx`（L87-89）

将 packageKeys 逻辑扩展，`emotion_stress_7` 也兼容 `synergy_bundle`：

```typescript
const packageKeys = ['emotion_journal_21', 'emotion_stress_7'].includes(campType!)
  ? ['synergy_bundle', `camp-${campType}`]
  : [`camp-${campType}`];
```

### 2. `src/hooks/useCampPurchase.ts`（getCompatibleCampTypes）

添加 `emotion_stress_7` → `synergy_bundle` 映射：

```typescript
if (campType === 'emotion_stress_7') {
  return ['emotion_stress_7', 'synergy_bundle'];
}
```

### 3. `src/hooks/useCampEntitlement.ts`（getCompatibleCampTypes）

同步添加相同映射。

| 文件 | 改动 |
|------|------|
| `src/pages/CampIntro.tsx` | L87-89: packageKeys 增加 emotion_stress_7 对 synergy_bundle 的兼容 |
| `src/hooks/useCampPurchase.ts` | getCompatibleCampTypes 增加 emotion_stress_7 映射 |
| `src/hooks/useCampEntitlement.ts` | getCompatibleCampTypes 增加 emotion_stress_7 映射 |

