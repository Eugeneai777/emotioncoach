# 修复：35+ 女性竞争力测评 未登录直接进入支付

## 问题定位
- 数据库 `partner_assessment_templates.women_competitiveness` 中 `require_auth = false`，`require_payment = true`。
- 因此 `DynamicAssessmentIntro` 里的 `if (requireAuth && !user)` 守卫直接被跳过，未登录用户点击「¥9.9 开始测评」会直接打开 `AssessmentPayDialog`，未做登录确认。
- 与男版「未登录先答题」Lite 模式不同，女版希望付费类入口必须先登录再付费。

## 方案（单步，最小改动）

### Step 1：数据迁移，开启 require_auth
将该模板的 `require_auth` 改为 `true`：

```sql
UPDATE public.partner_assessment_templates
SET require_auth = true
WHERE assessment_key = 'women_competitiveness';
```

效果：
- 未登录点击「¥9.9 开始测评」→ toast 提示「请先登录后开始测评」→ 跳转 `/auth?redirect=/assessment/women_competitiveness`。
- 登录回跳后再次点击 → 弹出付费弹窗 → 完成 9.9 支付 → 进入答题。
- 已登录已购用户：直接进入答题，行为不变。

## 兜底原则（无需改代码）
- `DynamicAssessmentIntro` 的两个 CTA（顶部"再测一次"、底部主按钮）均已实现 `requireAuth && !user` 拦截，本次仅靠数据开关即可生效。
- 不影响男版 `male_midlife_vitality` 的 Lite 体验（其 `require_auth = false` 保持不变）。

## 验证
1. 退出登录，访问 `/assessment/women_competitiveness`。
2. 点击「¥9.9 开始测评」→ 应跳转登录页，URL 携带 redirect。
3. 登录成功 → 回到 intro，再点 → 弹出支付。
4. 完成支付 → 进入答题。

## 涉及文件
- 数据库 migration（仅 1 条 UPDATE）。
- 无前端代码改动。
