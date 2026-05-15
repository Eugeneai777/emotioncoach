# 男人有劲测评 · 题目顺序打乱方案

只做顺序随机化，不引入第二套题库，零数据库改动，零成本，零下游影响。

## 目标

- 二刷用户每次看到的题目顺序不同，降低疲劳感
- 同一次测评内顺序稳定（刷新页面不会跳题）
- 维度结构、评分逻辑、结果页、AI 洞察 100% 不受影响

## 打乱策略

**维度内打乱**（推荐 / 已与你确认方向一致）：

```text
原顺序（固定）：
[D1-Q1, D1-Q2, D2-Q3, D2-Q4, D3-Q5, D3-Q6, D4-Q7, D4-Q8, D5-Q9, D5-Q10]

打乱后（每次进入测评重新洗）：
- 5 个维度的「外层顺序」固定不变（保证节奏：紧张→疲劳→情绪→焦虑→驱动）
- 每个维度内部 2 题位置随机交换
- 多模态题（Q1 螺旋 / Q4 噪音 / Q6 门 / Q7 雨声）跟随题目走，不跟位置走
```

**为什么不全局打乱**：
- 全局打乱会让 4 道多模态题挤在一起或全堆开头/结尾，破坏节奏
- 维度外层固定可以让 AI 洞察的"渐进式画像"叙事保持稳定

## 种子策略（防刷新跳题）

- 种子 = `${userId || anonId}_${templateId}_${attemptStartTimestamp}`
- 存到 `sessionStorage`，同一次测评全程复用
- 提交答案后清除，下次进入重新洗
- 这样保证：
  - 用户中途刷新页面 → 顺序不变
  - 用户提交后再次进入测评 → 新顺序
  - 不同用户 → 不同顺序

## 多模态题处理

当前 `QuestionMedia.tsx` 是「按题目 index 渲染」（Q1/Q4/Q6/Q7 位置硬编码）。

改为「按 question.id 渲染」：
- 在题目数据上加 `media_key` 字段（如 `spiral` / `noise` / `door` / `rain`）
- `QuestionMedia` 用 `question.media_key` 查找媒体素材，与位置解耦
- 打乱后媒体跟着题目走，不会出现"第 1 题文字 + 螺旋图"的错位

## 改动范围

| 文件 | 改动 | 行数 |
|---|---|---|
| `DynamicAssessmentQuestions.tsx` | 加 `useMemo` 维度内 shuffle + sessionStorage 种子 | ~30 行 |
| `QuestionMedia.tsx` | 从 index-based 改为 key-based 查找 | ~20 行 |
| `partner_assessment_templates`（数据） | 给 4 道多模态题的 `metadata` 加 `media_key` 字段（一次 update） | 1 次 migration |

**完全不动**：
- 评分逻辑（`scoring-engine.ts`）—— 答案仍按 question.id 提交，与顺序无关
- 结果页（`DynamicAssessmentResult.tsx` 4 屏漏斗）
- 维度映射、盲区/即刻行动/MBTI 标签
- AI 洞察 prompt
- 历史结果 `partner_assessment_results`

## 兼容性 / 流畅度评估

- ✅ **历史数据**：答案以 `question.id` 为 key 存储，顺序变化对历史无影响
- ✅ **进度条**：原本就是 `current/total`，与顺序无关
- ✅ **iOS 音频/视觉**：媒体跟 question.id 绑定，单例播放器逻辑不变
- ✅ **AI 洞察**：基于 `dimension_scores` 而非答题顺序，输出稳定
- ✅ **分享海报**：基于 `primary_pattern`，无影响
- ⚠️ **唯一注意**：维度外层顺序保持固定，避免 AI 洞察叙事跳脱

## 降级

- `sessionStorage` 不可用 → 用内存 state 兜底（同次测评内顺序稳定，刷新会重洗，可接受）
- `media_key` 缺失 → 不渲染媒体（与现有缺失逻辑一致）

## 验收

1. 同一用户连续 3 次进入测评 → 题目顺序应不同（至少有维度内交换）
2. 测评中刷新页面 → 顺序不跳
3. 4 道多模态题的素材始终跟随对应题目（不会错配）
4. 提交后结果页、AI 洞察、雷达图、分享海报全部正常
5. 其他测评（SBTI / 女性 / 财富）无任何变化
