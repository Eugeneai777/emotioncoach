## 目标
1. 移除 `male_midlife_vitality` 的 Lite 白名单 → 未登录无法答题，必须登录后才能开始测评。
2. 移除 Intro 页底部小字「💡 登录 后可保存测评记录」整段提示。

## 改动

### 1. `src/pages/DynamicAssessmentPage.tsx`
- 将 `LITE_MODE_KEYS = ['male_midlife_vitality']` 改为 `LITE_MODE_KEYS: string[] = []`（清空）。
- 这样未登录用户点击【🔥 限时免费开始评估】会被 `DynamicAssessmentIntro.tsx:231/431` 的 `requireAuth && !user` 拦截，跳转 `/auth?redirect=...` 或微信端 `/wechat-auth`。

### 2. `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx` (470–495)
- 删除整个 `!hasHistory && !requirePayment` 分支（包含「💡 登录 后可保存测评记录」），只保留 `hasHistory && onShowHistory` 分支。

## 不受影响
- 已购买/已登录用户的答题、PDF 凭证、加微信、SBTI 半成品报告（其他 SBTI 模板仍走 Lite，因 `assessment_key` 不在白名单时由 `scoring_type === 'sbti'` 触发；本次只移 `male_midlife_vitality`，但需注意：现行代码中 `isLiteMode` 还有第二个条件 `scoring_type === 'sbti'`——下方说明）。
- 管理员 PDF 直查（已实现）

## 注意点（请确认）
现行 `isLiteMode` 判定：
```
(assessment_key in LITE_MODE_KEYS) || (scoring_type === 'sbti')
```
`male_midlife_vitality` 的 `scoring_type` 若是 `sbti`，仅清空白名单**不够**，仍会走 Lite。

我会先查 DB 确认其 `scoring_type`：
- 若不是 `sbti` → 仅清空白名单即可。
- 若是 `sbti` → 在 `isLiteMode` 中增加排除：`assessment_key !== 'male_midlife_vitality'`，确保只对该测评收紧，不影响其他 SBTI 测评。

## 涉及文件
- `src/pages/DynamicAssessmentPage.tsx`
- `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx`
