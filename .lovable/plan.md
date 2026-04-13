

# SBTI测评历史完整展示 + 学习中心集成

## 问题诊断

### 问题1：历史页展示不完整
- 当前 `DynamicAssessmentHistory` 组件仅以 Badge 标签显示 `score/maxScore`，缺少：
  - SBTI 五大模型分组的 H/M/L 展示
  - 能力雷达图
  - AI 个性化洞察
- 数据库中 `ai_insight` 字段全部为 `null`——因为 AI 洞察是前端调用 edge function 生成的，但 `useSaveAssessmentResult` 的 `mutate` 调用中**没有传 `ai_insight`**，所以从未保存过

### 问题2：学习中心看不到 SBTI
- `CampList.tsx` 的 `myAssessments` 查询只查 `orders`（付费测评）和 `awakening_entries`（免费测评）
- `partner_assessment_results`（SBTI 等动态引擎测评）从未被查询

## 变更计划

### 1. 保存 AI 洞察到数据库
**文件**：`src/pages/DynamicAssessmentPage.tsx`

在 `generateInsight` 成功后，调用 `supabase.from('partner_assessment_results').update({ ai_insight }).eq(...)` 将 AI 洞察回写到对应记录，确保历史页可以展示。

### 2. 历史页支持 SBTI 完整展示
**文件**：`src/components/dynamic-assessment/DynamicAssessmentHistory.tsx`

- 新增 `templateScoringType` prop，由父组件传入（从 template 的 scoring_type 获取）
- 当 `scoringType === 'sbti'` 时：
  - 将每条记录的 dimension_scores 按五大模型分组展示（自我/情感/态度/行动/社交），用 H/M/L 色彩标签替代 `score/maxScore`
  - 展示 `ai_insight` 字段（如已保存）
  - 点击单条记录可展开/折叠详情（雷达图 + AI 洞察）
- 非 SBTI 测评保持现有 Badge 展示不变

### 3. 学习中心集成动态测评历史
**文件**：`src/pages/CampList.tsx`

- 在 `myAssessments` 的 `Promise.all` 中新增第三个查询：`partner_assessment_results` 联查 `partner_assessment_templates`
- 按 `template_id` 去重，映射为统一的卡片数据（emoji、title、route → `/assessment/{assessment_key}`，tag → "已测"）
- 与现有付费/免费结果合并展示

### 4. 父组件传递 scoringType
**文件**：`src/pages/DynamicAssessmentPage.tsx`

在渲染 `DynamicAssessmentHistory` 时传入 `scoringType` prop。

## 涉及文件

| 文件 | 变更 |
|------|------|
| `src/pages/DynamicAssessmentPage.tsx` | AI 洞察回写数据库 + 传 scoringType 给 History |
| `src/components/dynamic-assessment/DynamicAssessmentHistory.tsx` | SBTI 分组展示 + 展开详情（雷达图/AI洞察） |
| `src/pages/CampList.tsx` | 新增 partner_assessment_results 查询 |

