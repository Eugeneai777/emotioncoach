

# 修复 SynergyPromoPage 残留旧内容 + 已购用户体验优化

## 问题

SynergyPromoPage 中仍有 2 处引用了旧的"21天情绪日记训练营"，应为"7天情绪解压训练营"。此外，已购用户重新进入页面仍需滚动大量营销内容才能找到入口。

## 修改方案

### 1. `src/pages/SynergyPromoPage.tsx` — 修复旧文案（2处）

| 行号 | 旧内容 | 新内容 |
|------|--------|--------|
| L156 | `21天情绪日记训练营已开通` | `7天情绪解压训练营已开通` |
| L168 | `进入情绪日记训练营` | `进入情绪解压训练营` |

### 2. 已购用户体验优化 — 页面顶部增加快捷入口卡片

当 `alreadyPurchased === true` 时，在 Hero 区域下方（Pain Points 之前）插入一个醒目的"已购快捷面板"，包含：
- ✅ 已购标识
- "进入训练营"按钮（智能跳转打卡页或介绍页）
- "查看订单与物流"按钮

这样已购用户无需滚到页面底部就能快速进入训练营。

### 3. 审视完整用户链路

检查点：
- **浏览** → 页面正确展示产品信息 ✓
- **购买** → 购买检测覆盖 orders + user_camp_purchases ✓（上轮已修复）
- **购买后** → SuccessPanel 文案修正为"7天情绪解压训练营"
- **再次进入** → alreadyPurchased=true，Hero/CTA/StickyBar 均显示已购状态 ✓，新增顶部快捷面板
- **学习** → handleEnterCamp 智能路由：有活跃营→打卡页，无→camp-intro ✓
- **查询订单** → 跳转 /settings?tab=account&view=orders ✓

| 文件 | 改动 |
|------|------|
| `src/pages/SynergyPromoPage.tsx` | 修复2处旧文案 + 已购用户顶部快捷面板 |

