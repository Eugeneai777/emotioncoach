

## 三个问题的诊断与修复方案

### 问题 1：知乐胶囊产品参数文字信息单独展示
**现状**：产品参数（每瓶90粒、每日3粒等）作为独立 Section 展示，与知乐胶囊产品图和双引擎板块割裂。

**方案**：将产品参数合并到"双引擎解决方案"板块中的知乐胶囊卡片内部，紧跟产品图下方，删除独立的"产品参数"Section。这样信息集中呈现，用户无需来回滚动。

| 文件 | 修改 |
|------|------|
| `src/pages/SynergyPromoPage.tsx` | 将 specs 网格嵌入双引擎的知乐胶囊区域（约 L486 产品图后），删除 L561-575 独立的 Section |

---

### 问题 2：已购用户点击"进入训练营"仍显示购买页
**现状**：SynergyPromoPage 的"进入训练营"跳转到 `/camp-intro/emotion_journal_21`，而 CampIntro 页面的购买检测逻辑有缺陷：
- `useCampPurchase` 查 `user_camp_purchases` 表（synergy_bundle 购买不会写入此表）
- 虽然有 `orderPurchase` 二次校验查 orders 表，但只查 `package_key IN ['synergy_bundle', 'camp-emotion_journal_21']`
- 即使检测到已购买，如果没有活跃的 training_camps 记录，用户看到的是"已购买，立即开始"按钮，点击后打开 StartCampDialog 而非直接进入训练营

**根本原因**：购买套餐后，系统可能没有自动创建 training_camps 记录，导致 `existingCamp` 为 null，CTA 显示为"已购买，立即开始"而非"继续训练"。

**方案**：
1. 修改 SynergyPromoPage 的"进入训练营"按钮，先查询用户是否已有活跃训练营，如有则直接跳转到打卡页（`/camp-checkin/{campId}`），否则才跳到介绍页
2. 确保 CampIntro 的 `hasPurchased` 逻辑在识别到 synergy_bundle 后正确显示"开始训练"而非"购买"

| 文件 | 修改 |
|------|------|
| `src/pages/SynergyPromoPage.tsx` | `handleEnterCamp` 改为先查 training_camps 表，有活跃记录直接跳 `/camp-checkin/{id}`，无则跳 `/camp-intro/emotion_journal_21` |
| `src/pages/CampIntro.tsx` | 确认逻辑无误（当前代码已有双重校验），问题实际在于 SynergyPromoPage 的跳转目标 |

---

### 问题 3：小火箭菜单链接指向错误
**现状**：
- "已购订单"→ `/settings?tab=orders`，但 Settings 页没有 `orders` tab，只有 `account` tab 下显示 PurchaseHistory
- "已学课程"→ `/camps?filter=completed`，"待学课程"→ `/camps?filter=active`，但 CampList 页面不读取 `filter` query 参数

**方案**：
1. "已购订单"路径改为 `/settings?tab=account`（账户 tab 已包含购买历史和物流跟踪）
2. CampList 页面增加对 `filter` query 参数的支持：读取 `useSearchParams`，根据 filter 值查询用户的 training_camps 记录，展示对应状态的训练营

| 文件 | 修改 |
|------|------|
| `src/components/FloatingQuickMenu.tsx` | "已购订单"的 path 改为 `/settings?tab=account` |
| `src/pages/CampList.tsx` | 添加 `useSearchParams` 读取 `filter` 参数，当 filter 为 `completed` 或 `active` 时，展示用户已参加的训练营（从 training_camps 表查询），而非模板列表 |

