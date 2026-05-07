## 根因

数据库 `partner_assessment_results.dimension_scores` 实际存储为**数组**：
```json
[{ "key":"energy", "label":"精力续航", "emoji":"🔋", "maxScore":12, "score":12 }, ...]
```

但 `DynamicAssessmentPage.handleViewHistoryRecord`（管理员 PDF 入口走的就是这条路径）把它当成 `Record<string, number>` 来读：

```ts
const storedDims = record.dimension_scores as Record<string, number>;
score: Number(storedDims[d.key] ?? 0)   // 数组按 key 取永远是 undefined → 0
```

所以每个维度 `score=0`。男人有劲报告显示的是"翻转后的状态电量" = `maxScore - score` → 全部满分 100，且不同用户都被还原为 0，因此两个人六维明细完全一样。

## 修复方案

### 1. `src/pages/DynamicAssessmentPage.tsx` — 修复 `handleViewHistoryRecord`
兼容两种存储格式：
- **数组**（线上实际格式）：直接以 `template.dimensions` 顺序为基准，按 `key` 在数组里找匹配项，取其 `score`、`maxScore`、`label`、`emoji`，缺失才回退 0/模板值。
- **对象**（兜底兼容）：保留旧的 `Record<string, number>` 读法。

伪代码：
```ts
const storedRaw = record.dimension_scores;
const isArray = Array.isArray(storedRaw);
const byKey: Record<string, any> = isArray
  ? Object.fromEntries(storedRaw.map((d: any) => [d.key, d]))
  : storedRaw || {};

const dimensionScores = dims.map((d: any) => {
  const item = byKey[d.key];
  if (isArray) {
    return {
      key: d.key,
      label: item?.label ?? d.label,
      emoji: item?.emoji ?? d.emoji,
      maxScore: Number(item?.maxScore ?? d.maxScore ?? 0),
      score: Number(item?.score ?? 0),
    };
  }
  return {
    key: d.key, label: d.label, emoji: d.emoji,
    maxScore: d.maxScore || 0,
    score: Number(item ?? 0),
  };
});
```

`maxScore` 汇总也用每个维度真实值求和。

### 2. `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx` — 老用户快捷卡兜底
`lastSummary` 已假设数组，无需改动；只在 `totalMax === 0` 时回退到 `template` 的总分，避免极端情况显示异常百分比。

### 3. 验证
读两个真实 recordId（不同用户），管理员链路打开 `?recordId=...&adminPdf=1&autoSave=pdf`，确认六维分数与数据库一致、两份报告内容不同。

### 涉及文件
- `src/pages/DynamicAssessmentPage.tsx`
- `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx`（小幅兜底，可选）