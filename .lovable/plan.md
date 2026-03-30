
# /assessment/women_competitiveness 异常的修复方案（已定位根因）

## 根因结论
从控制台错误可确认：`DynamicAssessmentPage` 触发了 React Hooks 规则错误  
`Rendered more hooks than during the previous render.`

当前页面里 `useCallback` 定义在 `isLoading / !template` 的提前 `return` 之后。  
首次渲染（加载中）会提前返回，后续渲染（模板加载完成）才执行更多 hooks，导致 hook 数量前后不一致，最终进入“页面出现异常”。

---

## 实施改动（不改业务逻辑）

### 1) 修复 `src/pages/DynamicAssessmentPage.tsx` 的 hook 顺序问题（核心）
两种安全做法，优先采用更稳妥方案：
- 将 `handleQuestionsComplete / handleRetake / handlePaymentSuccess / handleDeleteRecord` 从 `useCallback` 改为普通函数（去掉该组件内的 `useCallback` hook 依赖）
- 或者把所有 `useCallback` 提前到任何条件 `return` 之前

建议采用第一种（普通函数），实现最直接、风险最低。

### 2) 增加模板空值保护（防二次异常）
在 `generateInsight`、`calculateAndShowResult` 内增加 `template` 判空保护，避免极端状态下访问 `template.title` 等字段造成运行时异常。

### 3) 保持当前路由与权限策略不变
- 继续使用统一入口：`/assessment/women_competitiveness`
- 不改定价、不改支付、不改测评题目与结果逻辑
- 不新增数据库变更（你已通过的匿名读取策略保持不动）

---

## 影响评估
- 仅修复前端渲染稳定性问题
- 不影响现有业务逻辑与数据
- 手机端/电脑端排版不变
- 入口体验保持一致（女性专区测一测、/mama 测评入口都进入同一测评页）

---

## 验证清单（交付后执行）
1. 从 **mini-app 女性专区 → 测一测 → 35+女性竞争力** 进入，页面正常展示（不再异常页）。  
2. 从 **/mama → 测一测 → 35+女性竞争力** 进入，页面正常展示。  
3. 刷新 `/assessment/women_competitiveness?ref=share` 多次，控制台不再出现 hooks 数量错误。  
4. 题目作答、付费弹窗、结果页流程保持原有行为。  
5. 桌面与移动端均验证通过。
