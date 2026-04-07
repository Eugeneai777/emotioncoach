

# 修复身份绽放训练营分享海报 + 删除底栏"AI教练"

## 问题

1. **分享海报内容错误**：底部分享按钮弹出的海报使用的是 `SynergyShareCard`（7天有劲训练营内容：琥珀色、AI情绪教练、7天冥想等），应展示身份绽放训练营专属内容
2. **底栏仍显示"AI教练"**：L1210 的描述文字 `¥3980 · AI教练+专业教练+知乐胶囊×4` 需删除"AI教练+"

## 改动

### 1. 新建 `src/components/promo/IdentityBloomShareCard.tsx`

基于 `SynergyShareCard` 结构，替换为身份绽放训练营内容：

- **配色**：靛蓝→紫色渐变（与落地页一致）
- **Badge**：`🌟 找回真实自己·活出生命力量`
- **标题**：`身份绽放训练营`
- **副标题**：`身份重建 · 关系重塑 · 能量觉醒` / `专业教练 + 知乐胶囊×4`
- **3个亮点**：
  - `🎯 资深教练小组辅导 · 量身定制`
  - `📚 16节音频课 + 16次教练课`
  - `💊 知乐胶囊×4 · 天然植物配方`
- **QR路径**：`/promo/identity-bloom`

### 2. `src/pages/IdentityBloomPromoPage.tsx`

- **导入替换**：`SynergyShareCard` → `IdentityBloomShareCard`
- **L1247/L1251**：使用 `IdentityBloomShareCard`
- **L1210**：`AI教练+专业教练+知乐胶囊×4` → `专业教练+知乐胶囊×4`

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/components/promo/IdentityBloomShareCard.tsx` | 新建 |
| `src/pages/IdentityBloomPromoPage.tsx` | 替换分享卡片组件 + 删除"AI教练" |

