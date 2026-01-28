

## 修正体验包逻辑说明

### 问题分析

当前文案错误地表述为"用户扫码获得全部4项权益"，但实际逻辑是：
- **有劲合伙人拥有4种体验包**作为转化用户的工具
- **用户扫码时根据入口不同，只兑换其中1个体验包**
- 这4种体验包是合伙人可以用来吸引不同类型用户的产品组合

### 需要修改的文件

| 文件 | 修改内容 |
|:-----|:---------|
| `src/pages/YoujinPartnerIntro.tsx` | 修改体验包说明文案 |
| `src/components/ProductComparisonTable.tsx` | 修改体验包说明文案 |

---

### 1. 修改 `src/pages/YoujinPartnerIntro.tsx`

**第155-157行**：
```tsx
// 修改前
<CardTitle className="text-xl flex items-center gap-2">
  <Gift className="w-5 h-5 text-teal-500" />
  体验包内容（共4项）
</CardTitle>
<CardDescription>用户扫码后将获得以下全部权益</CardDescription>

// 修改后
<CardTitle className="text-xl flex items-center gap-2">
  <Gift className="w-5 h-5 text-teal-500" />
  可分发的体验包（共4种）
</CardTitle>
<CardDescription>合伙人可使用以下体验包转化用户，每次扫码兑换1种</CardDescription>
```

---

### 2. 修改 `src/components/ProductComparisonTable.tsx`

**第590-592行**：
```tsx
// 修改前
<div className="flex items-center gap-2">
  <span className="text-xl">🎁</span>
  <h4 className="font-bold text-base">体验包内容（共4项）</h4>
</div>

// 修改后
<div className="flex items-center gap-2">
  <span className="text-xl">🎁</span>
  <h4 className="font-bold text-base">可分发的体验包（共4种）</h4>
</div>
```

**第625-629行**：
```tsx
// 修改前
<div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
  <p className="flex items-start gap-2">
    <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
    <span>用户扫码即可获得以上全部4项权益，并<strong className="text-foreground">永久绑定</strong>为您的学员。</span>
  </p>
</div>

// 修改后
<div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
  <p className="flex items-start gap-2">
    <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
    <span>合伙人可使用以上4种体验包来转化用户，用户扫码兑换后<strong className="text-foreground">永久绑定</strong>为您的学员。</span>
  </p>
</div>
```

---

### 修改后的逻辑说明

| 修改前 | 修改后 |
|:-------|:-------|
| 体验包内容（共4项） | 可分发的体验包（共4种） |
| 用户扫码后将获得以下全部权益 | 合伙人可使用以下体验包转化用户，每次扫码兑换1种 |
| 用户扫码即可获得以上全部4项权益 | 合伙人可使用以上4种体验包来转化用户，用户扫码兑换后永久绑定 |

