
# SBTI 测评完成后 AI 推荐7天有劲训练营

## 方案

### 1. 数据库更新
SQL migration 更新 `sbti_personality` 模板，设置 `recommended_camp_types` 为 `["emotion_stress_7"]`。

### 2. SBTI 专属推荐卡片
在 `DynamicAssessmentResult.tsx` 中，当 `isSBTI && recommendedCamps.length > 0` 时，替换通用训练营推荐卡片为一个更具转化力的专属卡片：

- **标题**：基于人格类型的个性化引导语，如"你的人格画像显示情绪内耗较高"
- **文案**：根据 SBTI 结果中的维度（如情感模型偏低）生成 AI 风格的推荐理由，点明"7天有劲训练营"如何帮助改善
- **CTA**：醒目的渐变按钮"了解7天有劲训练营 →"，点击跳转 `/promo/synergy`
- **视觉**：采用与 SBTI 风格一致的卡片设计，带人格代码标签

### 3. AI 洞察 prompt 增强
在生成 AI 个性化洞察时（已有 `aiInsight` 逻辑），确保 SBTI 的 coach_prompt 中包含训练营软推荐话术，让 AI 洞察文本自然提到情绪管理训练的价值。

## 文件变更
| 文件 | 操作 |
|------|------|
| 数据库 migration | UPDATE `recommended_camp_types` = `["emotion_stress_7"]` |
| `DynamicAssessmentResult.tsx` | SBTI 专属高转化推荐卡片 |
| 数据库 migration | UPDATE `coach_prompt` 加入训练营软推荐引导 |
