
# 优化竞争力测评：雷达图修复 + 历史记录 + Logo

## 问题1：雷达图比例不正确

当前 `RadarChart` 缺少 `PolarRadiusAxis`，导致坐标轴域值不固定，图形比例失真。

**修复方案**（`CompetitivenessResult.tsx`）：
- 添加 `PolarRadiusAxis` 并设置 `domain={[0, 100]}`，确保5个维度在0-100范围内等比展示
- 添加 `Tooltip` 显示具体分值

## 问题2：保留历史测评记录

当前测评结果只在前端内存中，刷新即丢失。需要新建数据库表存储历史记录。

**数据库**：新建 `competitiveness_assessments` 表
- `id` (uuid, PK)
- `user_id` (uuid, 引用 profiles.id)
- `total_score` (integer)
- `level` (text)
- `category_scores` (jsonb) — 5维度分数
- `strongest_category` (text)
- `weakest_category` (text)
- `answers` (jsonb) — 原始答案
- `follow_up_insights` (jsonb) — AI追问回答
- `ai_analysis` (text) — AI解读内容缓存
- `created_at` (timestamptz)
- RLS策略：用户只能读写自己的记录

**前端改动**：
- `CompetitivenessResult.tsx`：测评完成后自动保存结果到数据库；AI解读生成后更新 `ai_analysis` 字段
- `CompetitivenessQuestions.tsx`：在开始页增加"历史记录"入口，查询并展示过往测评列表（日期 + 分数 + 等级），点击可查看历史报告
- `WomenCompetitiveness.tsx`：增加 `history` phase，支持查看历史记录详情

## 问题3：左上角统一加入Logo

当前结果页和答题页没有使用 `PageHeader` 组件。

**修复方案**：
- `CompetitivenessResult.tsx`：顶部替换当前的"重新测评"按钮为 `PageHeader` 组件（含Logo + 返回按钮）
- `CompetitivenessQuestions.tsx`：顶部加入 `PageHeader`（含Logo + 退出按钮）
- `CompetitivenessStartScreen.tsx`：顶部加入 `PageHeader`（含Logo）

## 技术细节

### 新建数据库表 SQL
```sql
CREATE TABLE competitiveness_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  total_score integer NOT NULL,
  level text NOT NULL,
  category_scores jsonb NOT NULL,
  strongest_category text NOT NULL,
  weakest_category text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  follow_up_insights jsonb,
  ai_analysis text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE competitiveness_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own assessments"
  ON competitiveness_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own assessments"
  ON competitiveness_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own assessments"
  ON competitiveness_assessments FOR UPDATE
  USING (auth.uid() = user_id);
```

### 修改文件清单

| 文件 | 改动 |
|------|------|
| `CompetitivenessResult.tsx` | 修复雷达图（加 PolarRadiusAxis）；加 PageHeader；保存结果到数据库；AI解读完成后更新记录 |
| `CompetitivenessQuestions.tsx` | 加 PageHeader 替代自定义顶栏 |
| `CompetitivenessStartScreen.tsx` | 加 PageHeader；加"历史记录"按钮 |
| `WomenCompetitiveness.tsx` | 增加 history phase；支持从历史记录加载旧报告 |
| 新建 `CompetitivenessHistory.tsx` | 历史记录列表组件（日期、分数、等级，点击查看详情） |
