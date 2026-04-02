

# /mama 和 /laoge 顶部横幅已购隐藏优化

## 现状

- `/mama`（MamaAssistant.tsx）第86-102行：sticky 顶部横幅推广"7天有劲训练营"，链接到 `/promo/synergy`
- `/laoge`（LaogeAI.tsx）第76-89行：sticky 顶部横幅推广"中年男人职场突围方案"，也链接到 `/promo/synergy`
- 两者都是推广 `synergy_bundle`，用户已购后仍然展示

## 方案

与 mini-app 轮播图机制一致：使用 `usePackagesPurchased` 检查 `synergy_bundle` 购买状态，已购则隐藏顶部横幅。

### 文件变更

| 文件 | 操作 |
|---|---|
| `src/pages/MamaAssistant.tsx` | 引入 `usePackagesPurchased`，检查 `synergy_bundle`；已购时隐藏第86-102行的 sticky 横幅 |
| `src/pages/LaogeAI.tsx` | 同上，已购时隐藏第76-89行的 sticky 横幅 |

### 逻辑

```typescript
const { user } = useAuth();
const { data: purchasedMap } = usePackagesPurchased(['synergy_bundle']);
const campPurchased = !!user && !!purchasedMap?.['synergy_bundle'];
// campPurchased 为 true → 不渲染横幅
// 未登录 → 展示横幅
```

