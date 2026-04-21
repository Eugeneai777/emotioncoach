

## 修复 35+女性竞争力测评选项顺序混乱

### 问题根因
路径 `/assessment/women_competitiveness` 走 `DynamicAssessmentPage` → `DynamicAssessmentQuestions` 组件。

该组件在 `src/components/dynamic-assessment/DynamicAssessmentQuestions.tsx` 第 49-54 行对**每道题的选项做了独立的 seeded 随机排序**：

```ts
return questions.map((question, idx) => {
  const opts = getOptionsForQuestion(question);
  return seededShuffle(opts, idx * 97 + 31);  // ← 每题不同 seed
});
```

结果：
- Q1 显示：偶尔这样 / 太像我了 / 完全不是我 / 经常这样 / 有时会
- Q27 显示：太像我了 / 有时会 / 经常这样 / 完全不是我 / 偶尔这样

5 个本来是单调递进（1→5 分）的李克特量表选项，在用户眼里变成了 27 道题随机洗牌，体感非常混乱、容易点错。

### 关键约束（不影响现有逻辑）
- 评分使用 `opt.score`（非位置），所以**取消洗牌完全不影响总分**
- 反向计分题（`positive: false`）走的是 score 翻转，与顺序无关，**也不影响**
- 历史报告、AI 洞察、付费墙、分享海报等所有下游逻辑都基于 `score` 数值，**全部不受影响**
- 该组件被全站所有 `DynamicAssessmentPage` 测评共用（情绪健康、SCL-90、SBTI、财富卡点等）

### 实施方案

**只改一个文件：`src/components/dynamic-assessment/DynamicAssessmentQuestions.tsx`**

#### 改动 1：模板级共享选项 → 不洗牌（统一顺序）
当题目使用模板级 `scoreOptions`（即所有题共享同一套李克特选项，如 1=完全不是我 … 5=太像我了）时，**按 score 升序稳定排序**，所有题保持完全一致的视觉顺序。

#### 改动 2：题目自定义选项 → 保留原顺序
当题目自带 `question.options`（如 SBTI 的二选一人格题、有特殊语义顺序的题）时，**按数据库里配置的顺序原样渲染**，不再随机。这同样让用户体感稳定，且尊重内容编辑在后台配置的顺序。

#### 改动 3：移除 `seededShuffle` 函数
不再使用，整段删掉。

### 改后效果
- 27 道题选项顺序统一为：`1 完全不是我 / 2 偶尔这样 / 3 有时会 / 4 经常这样 / 5 太像我了`（按 score 升序）
- 用户一眼能识别"越往下越像我"，答题速度大幅提升
- 误点率下降，数据质量提升
- 总分、维度分、等级判定、AI 解读、报告海报全部维持原状

### 不改的范围
- `competitivenessData.ts`（前端兜底数据）不动
- 数据库题目内容、`score_options` 配置不动
- 评分引擎 `scoring-engine` 不动
- 路由、付费墙、登录态、历史记录、分享逻辑均不动
- 其他测评（情绪健康、SCL-90、SBTI、财富卡点等）同步受益于"选项顺序稳定"，不会破坏其评分

### 验证步骤
1. 访问 `https://wechat.eugenewe.net/assessment/women_competitiveness`
2. 完成支付/已购态进入答题
3. 翻看 Q1、Q10、Q20、Q27，选项顺序应**完全一致**：完全不是我 → 偶尔这样 → 有时会 → 经常这样 → 太像我了
4. 完成 27 题查看报告，总分、五维雷达图、等级判定与改动前一致
5. 抽查另一个 Dynamic 测评（如 `/assessment/scl90`），确认选项顺序也变得稳定且报告正常

### 涉及文件
- `src/components/dynamic-assessment/DynamicAssessmentQuestions.tsx`（仅修改 14-54 行的 shuffle 逻辑）

