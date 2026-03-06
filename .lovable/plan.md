

## 行业合伙人自建测评方案

### 核心思路

参考已有的 AI 创建教练流程（`AICoachCreator` → `generate-coach-template`），为测评创建类似的 AI 生成 + 手动微调流程。测评数据存储在新的 `partner_assessment_templates` 表中，前端使用通用的动态测评渲染器，无需为每个合伙人测评创建单独的页面组件。

### 1. 数据库设计

**新建 `partner_assessment_templates` 表：**

| 列名 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| created_by_partner_id | uuid FK → partners.id | 归属合伙人 |
| assessment_key | text unique | 唯一标识，如 `ind_zhile_anxiety` |
| title | text | 测评标题 |
| subtitle | text | 一句话描述 |
| description | text | 详细说明 |
| emoji | text | 图标 |
| gradient | text | 配色 |
| dimensions | jsonb | 维度定义数组 `[{key, label, emoji, description, maxScore}]` |
| questions | jsonb | 题目数组 `[{id, dimension, text, positive, options}]` |
| result_patterns | jsonb | 结果模式配置 `[{type, label, emoji, description, traits, tips}]` |
| scoring_logic | text | 评分说明（供 AI 分析用） |
| ai_insight_prompt | text | AI 生成个性化建议的 system prompt |
| page_route | text | 自动生成路由 `/assessment/ind_{code}_{key}` |
| is_active | boolean | 是否上线 |
| max_score | integer | 满分 |
| question_count | integer | 题目数量 |
| created_at / updated_at | timestamptz | |

**RLS 策略：**
- 合伙人可 CRUD 自己创建的测评（通过 `get_partner_id_for_user`）
- 所有已登录用户可 SELECT `is_active = true` 的测评（用于答题）

**新建 `partner_assessment_results` 表：** 存储用户答题结果

| 列名 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid FK | 答题用户 |
| template_id | uuid FK → partner_assessment_templates.id | |
| answers | jsonb | 原始答案 |
| dimension_scores | jsonb | 维度得分 |
| total_score | integer | 总分 |
| primary_pattern | text | 主要模式 |
| ai_insight | text | AI 分析 |
| created_at | timestamptz | |

### 2. 后端 Edge Function

**`generate-assessment-template`：** AI 根据合伙人描述（如"我想做一个职场倦怠测评"）生成完整测评模板，包含维度、题目（15-30题）、评分选项、结果模式和 AI 分析 prompt。使用 tool calling 返回结构化 JSON。

**`generate-partner-assessment-insight`：** 根据用户答题结果和模板中的 `ai_insight_prompt` 生成个性化分析报告。

### 3. 前端组件

| 组件 | 说明 |
|------|------|
| `PartnerAssessmentManager.tsx` | 合伙人测评管理面板（列表 + 创建入口），类似 `PartnerCoachManager` |
| `AIAssessmentCreator.tsx` | AI 生成测评对话框：Step1 描述需求 → Step2 预览 + 编辑维度/题目 → Step3 确认创建 |
| `DynamicAssessmentPage.tsx` | 通用动态测评渲染页面（开始页、答题、结果），从数据库读取模板配置驱动 UI |
| `usePartnerAssessments.ts` | CRUD hooks |

### 4. 路由与入口

- 测评路由：`/assessment/ind_{partner_code}_{assessment_key}`
- 在 `IndustryPartnerDashboard.tsx` 中新增"我的测评"模块
- 在行业合伙人管理后台增加"测评"Tab
- 每个合伙人限制创建 **3 个**测评

### 5. 编辑微调能力

AI 生成模板后，合伙人可在 Step2 中：
- 编辑测评标题、描述
- 增删改维度
- 编辑每道题的文本
- 调整评分选项
- 修改结果模式的描述和建议

### 修改文件清单

| 类型 | 文件 | 说明 |
|------|------|------|
| DB | 迁移 SQL | 新建 2 张表 + RLS |
| 新建 | `supabase/functions/generate-assessment-template/index.ts` | AI 生成测评模板 |
| 新建 | `supabase/functions/generate-partner-assessment-insight/index.ts` | AI 分析测评结果 |
| 新建 | `src/hooks/usePartnerAssessments.ts` | 测评 CRUD hooks |
| 新建 | `src/components/partner/PartnerAssessmentManager.tsx` | 测评管理面板 |
| 新建 | `src/components/partner/AIAssessmentCreator.tsx` | AI 创建 + 编辑对话框 |
| 新建 | `src/pages/DynamicAssessmentPage.tsx` | 通用测评渲染页 |
| 改 | `src/components/partner/IndustryPartnerDashboard.tsx` | 增加测评管理模块 |
| 改 | `src/components/admin/IndustryPartnerManagement.tsx` | 增加"测评"Tab |
| 改 | `src/App.tsx` | 增加动态测评路由 |

