

## 计划：在 AssessmentEditor 中添加 AI 教练选择器 + 结果页动态路由

### 现状分析

`AssessmentEditor` 已支持：二维码上传、训练营勾选、`coach_prompt` 文本框、付费/认证设置。

**缺失的关键功能：**
1. **教练选择器** — `coach_type` 字段存在但无 UI。合伙人只能手写 `coach_prompt`，无法从已有教练模板中选择。
2. **结果页路由硬编码** — `DynamicAssessmentResult.tsx` 固定跳转 `/assessment-coach`，未根据 `coach_type` 动态路由到对应教练页面。
3. **评分类型选择器** — `scoring_type` 字段已加入数据库，但编辑器中无下拉选择 UI。

### 实施内容

#### 1. AssessmentEditor — 添加教练选择器

在"AI 教练解读提示词"卡片上方新增"选择 AI 教练"区域：
- 从 `coach_templates` 拉取合伙人自己的教练 + 平台公共教练
- 用 `Select` 下拉展示教练列表（emoji + title）
- 选中后自动填充 `coach_type = coach_key`，并用教练的 `system_prompt` 预填 `coach_prompt`
- 提供"无教练"选项清空配置
- 保留现有 `coach_prompt` 文本框作为自定义覆写

#### 2. AssessmentEditor — 添加评分类型选择器

在基础信息卡片中增加下拉：
- 选项：`additive`（标准加分）、`weighted`（加权）、`clinical`（临床）
- 保存时写入 `scoring_type` 字段

#### 3. DynamicAssessmentResult — 动态教练路由

- 接收 `coach_type` 属性
- 当用户点击"AI 教练深度解读"时，根据 `coach_type` 查询 `coach_templates.page_route`
- 跳转到对应路由，回退到 `/assessment-coach`

#### 4. DynamicAssessmentPage — 传递 coach_type

- 将 `coach_type` 从模板数据透传到 `DynamicAssessmentResult`

### 文件变更

| 文件 | 变更 |
|------|------|
| `src/components/partner/AssessmentEditor.tsx` | 新增教练选择下拉 + 评分类型下拉 |
| `src/components/dynamic-assessment/DynamicAssessmentResult.tsx` | 接收 `coach_type`，动态查询路由 |
| `src/pages/DynamicAssessmentPage.tsx` | 透传 `coach_type` |

无数据库变更（`coach_type`、`scoring_type` 字段已存在）。

