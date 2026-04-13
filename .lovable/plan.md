

# 修复 SBTI 历史页展示不完整

## 根因

数据库 `partner_assessment_templates` 表中 SBTI 模板的 `scoring_type` 列值为 `'additive'`，而实际的 `'sbti'` 值藏在 `scoring_logic` JSON 字段里。

代码逻辑（`DynamicAssessmentPage.tsx` 第43-49行）优先读取 `scoring_type` 列，得到 `'additive'`，导致 `isSBTI = false`，历史页始终走「非SBTI」的紧凑Badge展示分支。

## 修复方案

### 1. 更新数据库（数据库迁移）
```sql
UPDATE partner_assessment_templates 
SET scoring_type = 'sbti' 
WHERE assessment_key = 'sbti_personality';
```

### 2. 优化 scoringType 读取逻辑（保险措施）
**文件**：`src/pages/DynamicAssessmentPage.tsx`

修改第43-50行的 `scoringType` 计算逻辑，优先从 `scoring_logic.scoring_type` 读取，`scoring_type` 列作为兜底：

```typescript
const scoringType = (() => {
  // 优先从 scoring_logic JSON 中读取
  try {
    const sl = tpl?.scoring_logic;
    const fromJson = typeof sl === 'string' ? JSON.parse(sl)?.scoring_type : sl?.scoring_type;
    if (fromJson) return fromJson;
  } catch {}
  // 兜底用列值
  return tpl?.scoring_type || 'additive';
})();
```

## 涉及文件

| 文件 | 变更 |
|------|------|
| 数据库迁移 | `scoring_type` 列更新为 `'sbti'` |
| `src/pages/DynamicAssessmentPage.tsx` | scoringType 读取逻辑优先 JSON 字段 |

