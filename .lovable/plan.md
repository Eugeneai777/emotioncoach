## 问题根因

数据库中 `male_midlife_vitality` 模板的 `require_auth = false`，所以前端把它当成免登录测评，未登录点击「限时免费开始评估」直接进入题目。

## 修改方案

### 1. 数据库修正
将 `partner_assessment_templates` 中 `male_midlife_vitality` 的 `require_auth` 从 `false` 改为 `true`。

### 2. 前端保险（不影响其他测评）
在 `src/pages/DynamicAssessmentPage.tsx` 中，`_requireAuth` 计算追加白名单：当 `assessment_key === 'male_midlife_vitality'` 时，无论数据库怎么配，前端一律强制登录。

```ts
const FORCE_AUTH_KEYS = ['male_midlife_vitality'];
const _requireAuth = FORCE_AUTH_KEYS.includes(template?.assessment_key || '')
  ? true
  : (tpl?.require_auth ?? true);
```

这样：
- 顶部 CTA「限时免费开始评估」→ `handleStart` → 跳 `/auth?redirect=...`
- 底部所有入口同样跳登录
- 即使带 `?recordId=` 直链，未登录也无法触发答题（intro 阶段拦截）
- 其他测评行为完全不变（仍走数据库 `require_auth` 配置）

### 3. 兼容性确认
- 老用户已登录 → 行为不变，仍可正常答题/查看历史
- 微信内置浏览器 / 小程序 H5 / 普通浏览器 → 都走相同 `navigate('/auth?redirect=...')`，已验证流程
- 分享链接 `?ref=share` → 跳登录后回跳保留参数（已用 `setPostAuthRedirect` + URL redirect 双锚）
- 不影响其他测评、不影响 Lite 模式逻辑（`male_midlife_vitality` 不在 LITE_MODE_KEYS）

## 涉及文件
- `src/pages/DynamicAssessmentPage.tsx`（约 2 行）
- 一次数据库迁移更新模板配置