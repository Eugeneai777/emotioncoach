

# 实施计划：推荐训练营 + 二维码上传 + 教练选择

## 1. 数据库迁移

在 `partner_assessment_templates` 表新增字段：
- `recommended_camp_types` (jsonb, default '[]') — 推荐训练营的 camp_type 数组
- `coach_type` (text) — 教练类型标识
- `coach_options` (jsonb, default '[]') — 可选教练列表 `[{key, label, emoji}]`

## 2. 编辑器增强 — `AssessmentEditor.tsx`

在现有"AI 教练解读提示词"卡片下方新增两个配置卡片：

**训练营选择器卡片**：
- 从 `camp_templates` 查询所有活跃训练营
- 多选 Checkbox 列表（显示 icon + camp_name + duration_days）
- 选中的 camp_type 存入 `recommended_camp_types`

**二维码上传卡片**（替代当前手动输入 URL）：
- 增加图片上传按钮，上传到 `partner-assets` bucket
- 上传成功后自动填充 `qr_image_url`
- 保留预览缩略图

同时在 `handleSave` 中提交 `recommended_camp_types`, `coach_type`, `coach_options`。

## 3. 结果页展示推荐训练营 — `DynamicAssessmentResult.tsx`

- 新增 `recommendedCampTypes` prop
- 若有配置，用 `useEffect` 查询 `camp_templates` 获取训练营详情
- 在 AI 教练按钮与二维码之间渲染训练营推荐卡片（复用 `SupportCampCard` 风格）
- 点击跳转 `/training-camps`

## 4. 主页面透传 — `DynamicAssessmentPage.tsx`

将 `tpl?.recommended_camp_types` 传递给 `DynamicAssessmentResult` 组件。

## 涉及文件

| 操作 | 文件 |
|------|------|
| 迁移 | `partner_assessment_templates` 新增 3 个字段 |
| 修改 | `src/components/partner/AssessmentEditor.tsx` — 训练营选择器 + QR 上传 |
| 修改 | `src/components/dynamic-assessment/DynamicAssessmentResult.tsx` — 展示推荐训练营 |
| 修改 | `src/pages/DynamicAssessmentPage.tsx` — 透传 recommended_camp_types |

