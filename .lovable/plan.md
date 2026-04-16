

# 测评 & 训练营"先登录再操作"统一优化

## 现状分析

| 场景 | 当前登录门槛 | 问题 |
|------|------------|------|
| **训练营购买**（CampIntro） | ✅ 点击购买时已检查登录 | 无问题 |
| **团队教练报名**（EnrollButton） | ✅ 报名时已检查登录 | 无问题 |
| **付费测评**（情绪健康、财富卡点、SCL、35+女性、中年觉醒） | ❌ 答完全部题目后才要求登录 | 用户做完题退出后丢失结果 |
| **SBTI 搞钱人格**（免费） | ❌ 游客可答题，仅看精简结果 | 用户退出后无法找回记录 |

**核心问题**：测评页面允许未登录用户完成全部答题，但结果保存依赖登录。用户做完退出 → 记录丢失 → 需要重新测评。

## 优化方案

**统一规则**：所有测评在点击"开始测评"时，如果用户未登录，先跳转登录页，登录后自动返回当前测评页继续。

### 修改点

**1. `DynamicAssessmentIntro.tsx` — 开始按钮增加登录拦截**

在 `onStart` 回调前插入登录检查：
- 未登录 → `navigate('/auth?redirect=/assessment/{key}')` + `setPostAuthRedirect`
- 已登录 → 正常进入答题

这是最干净的拦截点：用户在介绍页看完内容，点击开始时才要求登录，不影响浏览体验。

**2. `DynamicAssessmentPage.tsx` — 移除 SBTI 的 guest lite 模式**

- 删除 `handleQuestionsComplete` 中 SBTI 的 `isGuest → isLiteMode` 逻辑
- SBTI 统一走登录后答题 → 完整结果的链路
- `isLiteMode` 状态可以保留但不再被 guest 触发

**3. `DynamicAssessmentPage.tsx` — 移除 non-SBTI 的结果页登录跳转**

- 删除 `handleQuestionsComplete` 中 `requireAuth && !user` 的跳转逻辑（第170-175行）
- 因为登录已经在开始前完成，此处不再需要

### 不改动的部分

- **CampIntro**：购买按钮已有完善的登录拦截 ✅
- **EnrollButton**：报名按钮已有登录检查 ✅
- **StartCampDialog**：已有登录检查 ✅
- **测评介绍页浏览**：不要求登录，保持开放浏览策略

## 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx` | `onStart` 前增加 `useAuth` + 登录拦截 |
| `src/pages/DynamicAssessmentPage.tsx` | 移除 SBTI guest lite 逻辑 + 移除结果页登录跳转 |

共约 20 行改动，不涉及后端。

