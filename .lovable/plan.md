# 男人有劲状态测评 3 处修复

针对 `/assessment/male_midlife_vitality` 测评中"历史 vs 详情得分不一致、AI 洞察分数显示原始恢复阻力分、施强健康品牌词残留"三个问题进行修复。**仅作用于该测评**，不影响其他测评。

---

## 问题诊断

测评原始打分语义是"恢复阻力分"——**分数越低 = 状态越好**。详情页已经做了转译：
- 综合得分 → `有劲状态指数 = 100 - (totalScore / maxScore) * 100`
- 6 项维度也同样转译，并把"压力内耗→压力调节"、"恢复阻力→行动恢复力"

但有两个地方**漏做了转译**：

1. **历史列表** (`DynamicAssessmentHistory.tsx`)
   显示的是数据库原始 `total_score` 和 `dimension_scores`。所以恢复阻力 0 分(最佳状态)在历史里显示成"0 分 / 各维度 0/12 0/9"，点进详情却是 100%。

2. **AI 洞察 prompt** (`generate-partner-assessment-insight/index.ts`)
   prompt 里只用文字提示了"低分代表更稳"，但仍然把 `0/12 0/9` 这样的原始分喂给模型，导致 AI 直接把这些数字写进洞察文案里给用户看——用户看到的"精力续航 0/12"完全反直觉。

3. **品牌词残留**：edge function 系统提示和模型生成内容里没有把"施强健康"约束成"有劲AI"。

---

## 修复方案

### 1. 历史列表显示"有劲状态指数"(仅本测评)

**文件**：`src/pages/DynamicAssessmentPage.tsx`
- 把当前的 `assessment_key` 透传给 `<DynamicAssessmentHistory assessmentKey={template.assessment_key} ... />`

**文件**：`src/components/dynamic-assessment/DynamicAssessmentHistory.tsx`
- Props 增加 `assessmentKey?: string`
- 新增小工具(从 Result 文件复用同一公式)：
  ```ts
  const toVitalityStatusScore = (score, max) =>
    max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round(100 - (score/max)*100)));
  ```
- 当 `assessmentKey === 'male_midlife_vitality'` 时：
  - 列表卡片的 `{record.total_score} 分` → 显示 `{有劲状态指数}%`
  - 维度 Badge：`label score/maxScore` → 转译后的 `状态 100% · 稳`(与详情页文案一致)
  - 标签名 `压力内耗→压力调节`、`恢复阻力→行动恢复力`
  - 对比模式下展示的差值同样基于转译后的状态分计算
- 其他测评保持现状不变(走原有分支)

### 2. AI 洞察改用"有劲状态指数"喂给模型 + 品牌词约束

**文件**：`supabase/functions/generate-partner-assessment-insight/index.ts`

在已有 `isMaleMidlifeVitality` 分支基础上：

- **重写传给模型的维度数据**：当是该测评时，先把 `dimensionScores` 转成"有劲状态分"再拼到 user prompt：
  ```
  - 各项有劲状态：精力续航 100%(稳)、睡眠修复 100%(稳)、压力调节 100%(稳)...
  - 综合有劲状态指数：100%
  ```
  并明确告知模型："**禁止在文案中出现 0/12、0/9 这样的原始分，只能用百分比+档位表达**"。
- 把"压力内耗""恢复阻力"两个原始 label 在 prompt 里替换成"压力调节""行动恢复力"。
- **品牌词约束**：在 baseSystem 里追加一条规则：
  ```
  - 涉及品牌时统一使用"有劲AI"，**禁止出现"施强健康""施强"等历史品牌词**；
    如需提及训练营，统一用"7天有劲训练营"或"身份绽放训练营"。
  ```
- **保险兜底**：返回前对生成内容做一次字符串替换 `insight = insight.replace(/施强健康|施强/g, '有劲AI')`，防止偶发漏改。

### 3. 不动的部分

- 数据库 `partner_assessment_results` 写入逻辑保持不变(继续存原始恢复阻力分，转译只在展示层)。
- 其他测评(`emotion_health` / `sbti` / `scl90` 等)完全不受影响。
- 不重新触发已有历史记录的 AI 洞察重算——上述修复只对**新生成**的洞察生效；用户如想刷新旧记录的洞察，可在详情页点"重新生成"。

---

## 工作量

- 修改 3 个文件：`DynamicAssessmentPage.tsx`(传 prop)、`DynamicAssessmentHistory.tsx`(条件渲染)、`generate-partner-assessment-insight/index.ts`(prompt + 兜底替换)
- 预计 15 分钟内完成
- 风险：仅影响该测评的展示和文案，不动数据库/打分引擎/支付链路

确认后我切换到执行模式开始实施。