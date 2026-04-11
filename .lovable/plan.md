

# 创建 SBTI 人格测评

## 背景
SBTI（Silly Big Personality Test）是近期社交媒体爆火的娱乐型人格测试，31题、15维度、27种人格类型。风格幽默、自嘲，标签如 ZZZZ（装死者）、MALO（吗喽）、JOKE-R（小丑）等具有强传播性。

## 方案
利用现有的 **AI 测评生成器**（`generate-assessment-template` Edge Function）+ **统一测评引擎**（`DynamicAssessmentPage`），通过 AI 生成一个 SBTI 风格的测评模板，直接入库即可上线。

## 实施步骤

### 1. 调用 AI 生成 SBTI 风格测评模板
通过 Edge Function `generate-assessment-template`，输入详细的 SBTI 需求描述（包含5大模型、15维度、27种人格结果的核心概念），让 AI 生成完整的测评配置 JSON。

### 2. 手动补充/优化生成结果
AI 生成后可能需要微调：
- 确保人格标签命名有趣（参考 SBTI 原版风格：ZZZZ、MALO、SEXY 等）
- 31道题覆盖15个维度
- 结果描述保持幽默自嘲的调性

### 3. 写入数据库
将生成的模板插入 `partner_assessment_templates` 表，设置：
- `assessment_key`: `sbti_personality`
- `is_active`: true
- 关联到你的合伙人账号

### 4. 自动上线
统一引擎已有路由 `/assessment/sbti_personality`，无需额外代码改动。

## 技术细节
- 不需要新建任何组件或页面，完全复用现有引擎
- 评分类型使用 `additive`（标准加分制），按15维度打分后匹配27种人格
- 由于统一引擎的 `result_patterns` 最终按 scoreRange 匹配，需要将27种人格合理分布在不同分数区间，或使用维度组合逻辑

### 注意事项
当前引擎的 `result_patterns` 是按总分百分比区间匹配的，而 SBTI 原版是按维度组合判定人格类型。为了在现有引擎下实现，有两种路径：
- **简化版**：保留5-8种核心人格类型，按总分区间匹配（推荐，可快速上线）
- **完整版**：需要扩展评分引擎支持维度组合判定逻辑（工作量较大）

建议先用**简化版**快速上线，后续根据反馈迭代。

