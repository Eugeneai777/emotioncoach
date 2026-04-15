

# SBTI 结果页：替换训练营推荐为付费测评推荐

## 改动内容

**文件：`src/components/dynamic-assessment/DynamicAssessmentResult.tsx`**

将第 575-613 行的「7天有劲训练营」推荐区块替换为两张付费测评推荐卡片：

### 卡片 1：情绪健康测评（¥9.9）
- 路由：`/assessment/emotion_health`
- 文案："刚测完搞钱人格，再测测你的情绪'负债率'。PHQ-9 + GAD-7 专业双量表，看看焦虑和抑郁有没有在偷偷吃掉你的搞钱能量。"
- 渐变色：蓝绿系

### 卡片 2：SCL-90 心理健康测评（¥9.9）
- 路由：`/scl90`
- 文案："90 题全面体检你的心理状态，10 大维度精准扫描，比体检报告还详细的心理 CT。"
- 渐变色：紫蓝系

### 具体改动

1. **删除**第 575-613 行整个 SBTI 训练营推荐区块（`isSBTI && !isLiteMode && recommendedCamps.length > 0` 条件块）
2. **新增**一个 SBTI 专属付费测评推荐区块，包含两张卡片，样式沿用现有 Card 组件，`onClick` 导航到对应测评页
3. **可删除**不再使用的 `SBTI_CAMP_COPY` 常量和 `getSBTICampCopy` 函数（约第 70-130 行），保持代码整洁

### 不影响范围
- 非 SBTI 测评的训练营推荐（第 615-644 行）保持不变
- 评分逻辑、分享功能不受影响

| 文件 | 改动 |
|------|------|
| `src/components/dynamic-assessment/DynamicAssessmentResult.tsx` | 替换 SBTI 训练营推荐为付费测评推荐卡片 |

