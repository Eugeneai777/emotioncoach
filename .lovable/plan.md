## 收口 emotion_stress_7 → /promo/synergy，统一售前漏斗

### 改动概览（3 步）

#### 1. 评估结果页主 CTA 按权益分流
**`src/components/dynamic-assessment/male-vitality-funnel/CampPrimaryCTA.tsx`**
- 注入 `useCampPurchase('emotion_stress_7')`
- 已购 → `navigate('/camp-checkin?campType=emotion_stress_7')`，按钮文案改为"进入今日打卡 →"
- 未购 → `navigate('/promo/synergy')`，文案保持"了解 7 天有劲训练营 →"
- 同时调用 `behaviorTracker.trackEvent('assessment_result_to_synergy_click', { campType:'emotion_stress_7', purchased })`，让漏斗对账

#### 2. CampIntro 兜底重定向（防止旧链接 404）
**`src/pages/CampIntro.tsx`**
在组件顶部加 `useEffect`：当 `campType === 'emotion_stress_7'` 时 `navigate('/promo/synergy' + window.location.search, { replace: true })`。

效果：所有历史链接（站内残留、二维码海报、微信分享卡）自动收口，**0 回归风险**。

#### 3. 站内调用点统一改为 `/promo/synergy`
共 10 处 `navigate('/camp-intro/emotion_stress_7')` 直接替换为 `navigate('/promo/synergy')`：

| 文件 | 行号 |
|---|---|
| `src/pages/SynergyPromoPage.tsx` | 409 / 462 / 474（自跳转，应改为相对刷新或留 `/promo/synergy`） |
| `src/pages/ZhileCoachPromoPage.tsx` | 163 / 212 / 223 |
| `src/pages/PromoMidlife25to45Women399.tsx` | 119 / 130 / 733 |
| `src/components/wealth-block/WealthBlockResult.tsx` | 743 |
| `src/components/women-competitiveness/CompetitivenessResult.tsx` | 510 |
| `src/components/dynamic-assessment/DynamicAssessmentResult.tsx` | 1206 / 1234 |
| `src/utils/postPaymentRedirect.ts` | 5（支付后回跳保持 `/camp-checkin?campType=emotion_stress_7`，**不改**） |

说明：`postPaymentRedirect.ts:5` 是**已购买后**的目的地，应继续指向打卡或保留兜底，不在替换范围。

### 不在本次范围
- 不删 `/camp-intro/:campType` 动态路由（其余 5 个 campType 仍在用）
- 不删 `CampIntro.tsx` 组件
- 不动 wealth_block_7 / identity_bloom / emotion_journal_21 等其他 campType 的入口
- 不改业务逻辑、不动支付链路、不动 DB

### 验证
1. 未购用户：评估结果 → 点 CTA → 落到 `/promo/synergy`，新增 PV
2. 已购用户：评估结果 → 点 CTA → 落到 `/camp-checkin?campType=emotion_stress_7`
3. 直接访问 `/camp-intro/emotion_stress_7` → 自动 302 到 `/promo/synergy`
4. 其他 campType（如 `/camp-intro/identity_bloom`）不受影响，正常渲染
