

# 「7天有劲训练营」卡片改造 + 防重复购买

## 需求拆解

### 需求 1：点击行为分流
- **已购用户**：点击「7天有劲训练营」卡片 → 直接进入打卡页 `/camp-checkin`
- **未购买 / 游客**：点击 → 跳转 `/promo/synergy` 落地页

### 需求 2：防止同一用户未登录时重复购买
**场景**：用户 A 已购买，下次未登录状态访问 → 又走了一遍购买流程 → 产生重复订单

**解决方案**：在 `/promo/synergy` 的支付流程中，支付成功后用户必须登录才能开营。登录后系统通过 `user_id` 匹配到已有购买记录，自动合并权益（数据库唯一约束 `user_id + camp_type + payment_status` 已保障不会重复插入）。

具体防护措施：
- `/promo/synergy` 落地页点击购买时，**强制要求登录**（当前已有此逻辑）
- 登录后、支付前，检查是否已购买，若已购则直接跳转打卡页，跳过支付
- 数据库层面的唯一约束作为最终兜底

## 执行方案

### 1. 数据库更新（camp_templates 表）

| 字段 | 旧值 | 新值 |
|---|---|---|
| camp_name | 7天情绪解压训练营 | 7天有劲训练营 |
| camp_subtitle | 冥想·教练·打卡·分享，系统解压 | 冥想·教练·打卡，7天找回你的劲头 |
| description | （原描述） | 工作没劲、生活没劲、什么都提不起精神？7天系统训练，从身体到心理重新找回内在动力。 |
| gradient | （原值） | from-slate-700 to-amber-600 |
| icon | （原值） | 💪 |

### 2. CampList.tsx 点击逻辑改造

在 `onClick` 中为 `emotion_stress_7` 增加购买状态检查：

```typescript
// 新增 hook
const { data: stressCampPurchase } = useCampPurchase('emotion_stress_7');

// onClick 逻辑
if (camp.camp_type === 'emotion_stress_7') {
  if (stressCampPurchase) {
    // 已购 → 查找活跃训练营 → 跳转打卡页
    navigate('/camp-checkin');
  } else {
    // 未购 → 落地页
    navigate('/promo/synergy');
  }
}
```

### 3. 前端硬编码修正

- `src/pages/MiniAppEntry.tsx`："7天情绪解压" → "7天有劲训练营"
- `src/components/poster/PosterStatsCard.tsx`："7天情绪解压营" → "7天有劲训练营"

### 4. 防重复购买保障（已有，无需新增代码）

| 层级 | 机制 | 状态 |
|---|---|---|
| 前端 | `/promo/synergy` 购买前强制登录 | ✅ 已有 |
| 前端 | 登录后检测已购状态，已购显示"进入训练营" | ✅ 已有（SynergyPromoPage 的 purchaseData 检测） |
| 数据库 | `user_camp_purchases` 唯一约束 `(user_id, camp_type, payment_status)` | ✅ 已有 |
| 后端 | `wechat-pay-callback` 使用 upsert 防重复写入 | ✅ 已有 |

**结论**：当前架构已经能防止同一用户重复购买。即使用户未登录浏览了落地页，点击购买时会被要求登录，登录后系统会检测到已购状态并直接引导进入训练营。

## 改动文件

| 文件 | 改动 |
|---|---|
| `src/pages/CampList.tsx` | 引入 `useCampPurchase`，`emotion_stress_7` 点击分流 |
| `src/pages/MiniAppEntry.tsx` | 名称更新 |
| `src/components/poster/PosterStatsCard.tsx` | 名称更新 |
| 数据库 `camp_templates` | 名称/副标题/描述/样式更新 |

